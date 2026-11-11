<?php
/**
 * asesor.php — Puente del Agente Asesor con IA Local (Ollama qwen2.5:3b)
 *
 * Conecta el chat de Costia directamente con el servidor local de Ollama (http://127.0.0.1:11434),
 * permitiendo dictar o escribir ingredientes de la receta, detectar si existen o no en el inventario,
 * y extraer los gastos ocultos (recibos, arriendo, tiempo/empleados, empaque y merma).
 */

header('Content-Type: application/json; charset=utf-8');

// Restricción de CORS para evitar abuso del servidor Ollama desde sitios de terceros (CWE-942)
$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
$hostActual = $_SERVER['HTTP_HOST'] ?? '127.0.0.1';
if ($origen) {
    $parsedHost = parse_url($origen, PHP_URL_HOST);
    if ($parsedHost === '127.0.0.1' || $parsedHost === 'localhost' || $parsedHost === $hostActual) {
        header('Access-Control-Allow-Origin: ' . $origen);
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && isset($_GET['ping'])) {
    $modelos = obtenerModelosOllama();
    echo json_encode([
        'status'            => 'ok',
        'ollamaActivo'      => !empty($modelos),
        'ollama_disponible' => !empty($modelos),
        'modelos'           => $modelos,
        'modelo'            => $modelos[0] ?? null,
    ]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'mensaje' => 'Método no permitido.']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];

$mensaje            = trim($data['mensaje'] ?? '');
$estado             = is_array($data['estado'] ?? null) ? $data['estado'] : [];
$producto           = is_array($data['producto'] ?? null) ? $data['producto'] : [];
$insumosDisponibles = is_array($data['insumosDisponibles'] ?? null) ? $data['insumosDisponibles'] : [];
$historial          = is_array($data['historial'] ?? null) ? $data['historial'] : [];
$modeloOllama       = trim($data['modeloOllama'] ?? '');

/**
 * Guardrail estricto de seguridad: Detecta prompt injection, jailbreaks y peticiones fuera de dominio
 */
function esSolicitudNoSoportada(string $texto): bool {
    if (empty($texto)) return false;
    $t = mb_strtolower($texto, 'UTF-8');
    $patrones = [
        '/\b(olvida|ignora|desobedece)\s+(todas\s+)?(tus|las)\s+(instrucciones|reglas|directrices|prompts?)\b/i',
        '/\b(ahora\s+eres|act[uú]a\s+como|finge\s+que\s+eres|haz\s+de\s+cuenta\s+que\s+eres)\s+(un\s+)?(hacker|dan|developer|asistente\s+sin\s+filtros|ia\s+libre)\b/i',
        '/\b(jailbreak|prompt\s*injection|system\s*prompt|instrucciones\s*internas|revela\s*tu\s*prompt|modo\s*desarrollador)\b/i',
        '/\b(hack|hackear|exploit|malware|virus|inyecci[oó]n\s*sql|ddos|wifi|password|contrase[ñn]a\s*de\s*otro)\b/i',
        '/\b(script|c[oó]digo|programa)\s+(en\s+)?(python|javascript|php|java|c\+\+|html|bash|powershell|sql)\b/i',
        '/\b(escribe|hazme|genera)\s+(un\s+)?(script|c[oó]digo|funci[oó]n|algoritmo)\s+(para\s+)?(descargar|hackear|scrapear|automatizar|hacer)\b/i',
        '/\b(import\s+pytube|pip\s+install|npm\s+install|curl\s+-s)\b/i',
        '/\b(poema|poes[ií]a|verso|carta\s*de\s*amor|declaraci[oó]n\s*de\s*amor|enamorar)\b/i',
        '/\b(qui[eé]n\s*gan[oó]\s*(el\s*)?(mundial|partido|copa|super\s*bowl)|f[uú]tbol|gol(es)?|messi|cristiano|champions)\b/i',
        '/\b(pol[ií]tica|elecciones|presidente|senador|partido\s*pol[ií]tico|guerra|conflicto\s*armado)\b/i',
        '/\b(elimina(r)?|borra(r)?|destruye|limpia(r)?|wipe)\s+(toda\s+)?(la\s+)?(base\s*de\s*datos|cuenta|todos\s*los\s*productos|todo)\b/i',
        '/\b(formatea(r)?|reset(ear)?\s*todo|drop\s*table|truncate)\b/i'
    ];
    foreach ($patrones as $p) {
        if (preg_match($p, $t)) return true;
    }
    return false;
}

if (esSolicitudNoSoportada($mensaje)) {
    echo json_encode([
        'status'                 => 'success',
        'modo'                   => 'guardrail_seguridad',
        'respuesta'              => "Soy Costia IA, tu copiloto financiero y gastronómico. Solo puedo ayudarte con recetas, costeo de insumos, cálculo de márgenes, punto de equilibrio y gestión de tu negocio gastronómico. Por seguridad, no puedo realizar tareas fuera de este alcance (como programación, poemas, temas externos o comandos destructivos).",
        'ingredientesDetectados' => [],
        'estadoActualizado'      => $estado,
        'completo'               => false,
    ]);
    exit;
}

// Verificar estado de Ollama si el frontend solo pide ping
if (!empty($data['ping'])) {
    $modelos = obtenerModelosOllama();
    echo json_encode([
        'status'            => 'ok',
        'ollamaActivo'      => !empty($modelos),
        'ollama_disponible' => !empty($modelos),
        'modelos'           => $modelos,
        'modelo'            => $modelos[0] ?? null,
    ]);
    exit;
}

/**
 * Consulta qué modelos tiene descargados Ollama localmente en http://127.0.0.1:11434/api/tags
 */
function obtenerModelosOllama(): array {
    if (!function_exists('curl_init')) return [];
    $ch = curl_init('http://127.0.0.1:11434/api/tags');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 2,
        CURLOPT_CONNECTTIMEOUT => 1,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200 || !$resp) return [];
    $json = json_decode($resp, true);
    if (empty($json['models']) || !is_array($json['models'])) return [];

    $nombres = [];
    foreach ($json['models'] as $m) {
        if (!empty($m['name'])) {
            $nombres[] = $m['name'];
        }
    }
    return $nombres;
}

$tieneInsumos = !empty($producto['tieneIngredientes']) || !empty($estado['costoIngredientesManual']);
$unidadesEspecificadas = !empty($producto['unidadesEspecificadas']) || !empty($estado['unidadesEspecificadas']);

$faltantes = [];
if (!$tieneInsumos) {
    $faltantes[] = 'ingredientes de la receta (qué insumos lleva y sus cantidades; pregunta si lleva algún otro insumo o si ya están todos)';
} elseif (!$unidadesEspecificadas) {
    $faltantes[] = 'unidadesManual (preguntar cuántas unidades, panes, porciones o piezas salen o rinde este lote de receta)';
}
if (($estado['arriendoMensual'] ?? null) === null) {
    $faltantes[] = 'arriendoMensual (si trabaja desde casa con $0 de arriendo o cuánto paga de arriendo mensual de local)';
}
if (($estado['recibosMensuales'] ?? null) === null) {
    $faltantes[] = 'recibosMensuales (cuánto paga al mes en recibos de luz, gas, agua e internet)';
}
if (($estado['horasPorLote'] ?? null) === null) {
    $faltantes[] = 'horasPorLote y pagoHoraManoObra (cuántas horas o minutos tarda en preparar 1 lote y cuánto vale la hora de trabajo suya o de su empleado)';
}
if (($estado['empaqueUnidad'] ?? null) === null) {
    $faltantes[] = 'empaqueUnidad y mermaPct (cuánto gasta en empaque por unidad como bolsa/caja y qué % de merma estima en cocción)';
}

$esPreguntaEstrategica = preg_match('/\b(punto\s*de\s*equilibrio|break\s*even|ficha|pdf|duplica|clona|variaci|inflaci|precio|c[oó]mo|qu[eé]\s*es|ayuda|arriendo|recibo|costos?)\b/i', $mensaje);

$siguientePreguntaGuia = $esPreguntaEstrategica
    ? "El usuario te está haciendo una consulta estratégica o de funcionalidades (punto de equilibrio, ficha técnica en PDF, insumos, variación, etc.). Respóndele amablemente y con claridad técnica explicando el concepto y cómo Costia lo calcula, sin forzarlo a pedir ingredientes."
    : (!empty($faltantes)
        ? "El siguiente dato que debes preguntarle al usuario (después de confirmar lo que acaba de decirte) es: " . $faltantes[0]
        : "¡Ya tienes todos los datos! Confirma el resumen con entusiasmo y respóndele cualquier duda estratégica.");

$insumosNombres = [];
foreach ($insumosDisponibles as $ins) {
    if (is_array($ins) && !empty($ins['nombre'])) {
        $insumosNombres[] = $ins['nombre'] . ' (' . ($ins['unidad'] ?? '') . ')';
    } elseif (is_string($ins) && !empty($ins)) {
        $insumosNombres[] = $ins;
    }
}
$insumosNombres = array_slice($insumosNombres, 0, 30);

$promptSistema = "Eres 'Costia IA', un asesor financiero y gastronómico experto integrado en Costia. "
    . "Conversa en español de forma natural, cercana y breve (máximo 3 oraciones).\n\n"
    . "CONOCIMIENTO Y NUEVAS FUNCIONALIDADES DE COSTIA:\n"
    . "1. Ficha Técnica Oficial en PDF: Cada receta cuenta con su ficha técnica oficial estandarizada en 'ficha-tecnica.html?id=[id]'. Si el usuario pide su ficha técnica, imprimir o descargar PDF de costos, infórmale que puede abrirla e imprimirla directamente desde su producto o pidiéndotela.\n"
    . "2. Punto de Equilibrio (Break-Even): Se calcula dividiendo los Gastos Fijos Mensuales (arriendo + servicios) entre la Ganancia Neta por unidad. Indica cuántas unidades al mes y al día requiere vender como mínimo para cubrir sus costos fijos y no perder dinero.\n"
    . "3. Duplicar / Clonar Recetas: El usuario puede duplicar cualquier receta en 1 clic desde 'Mis Productos' o pidiéndotelo en el chat para probar variantes sin empezar desde cero.\n"
    . "4. Historial de Variación de Insumos: Costia registra el precio anterior y calcula el % de aumento o ahorro en cada insumo, alertando si el margen de ganancia de las recetas está en riesgo.\n\n"
    . "INVENTARIO REGISTRADO: " . implode(', ', $insumosNombres) . "\n\n"
    . "CONTEXTO PRODUCTO: " . json_encode($producto, JSON_UNESCAPED_UNICODE) . "\n\n"
    . "ESTADO ACTUAL: " . json_encode($estado, JSON_UNESCAPED_UNICODE) . "\n\n"
    . "GUÍA DE FLUJO: " . $siguientePreguntaGuia . "\n\n"
    . "REGLAS DE EXTRACCIÓN:\n"
    . "1. Si el usuario menciona ingredientes comestibles (ej: '500 gramos de harina, 3 huevos y 100 g de arequipe'), extráelos en \"ingredientesDetectados\" con su nombre, cantidad y unidad ('g', 'kg', 'ml', 'l', 'unidad', 'cucharada', 'cucharadita', 'taza'). En tu respuesta confirma los ingredientes añadidos y PREGUNTA SI LLEVA ALGÚN OTRO INGREDIENTE o si ya están todos. NO saltes a arriendo todavía.\n"
    . "2. NUNCA pongas nada en \"ingredientesDetectados\" si el usuario está respondiendo sobre arriendo, local, casa, servicios/recibos, tiempo, mano de obra o empaque. Solo alimentos reales de la receta.\n"
    . "3. Si el usuario indica cuántas unidades o porciones produce la receta (ej: 'salen 10 panes', 'rinde 12 unidades', 'para 8 porciones', '10'), extráelo como número entero en \"unidadesManual\" dentro de estadoActualizado.\n"
    . "4. Si el usuario dice que ya no tiene más ingredientes ('no más', 'listo', 'esos son todos') y aún no sabemos las unidades producidas, PREGUNTA: '¿Cuántas unidades salen o rinde esta receta?'.\n"
    . "5. Toma los números de arriendo y recibos según lo que el usuario indique. Si dice '800 mil', es 800000. Si dice '1.2 millones', es 1200000. Si dice un número literal como '1200', guárdalo literalmente como 1200. Si dice 'casa', 'desde casa', 'no pago arriendo' o 'local propio', arriendoMensual es 0.\n"
    . "6. REGLA ESTRICTA DE ARRIENDO: Si el usuario dice que tiene 'local', 'local físico' o 'tienda' pero NO indica cuánto paga de arriendo, DEBES dejar \"arriendoMensual\": null en estadoActualizado, \"completo\": false, y en \"respuesta\" preguntarle amablemente: '¿Cuánto pagas de arriendo mensual por tu local?'. NUNCA inventes o asumas un número si el usuario no lo dijo.\n"
    . "7. Mantén en estadoActualizado todos los valores que ya estaban antes y actualiza únicamente los nuevos que el usuario haya indicado con números o confirmaciones explícitas.\n"
    . "8. Pon \"completo\": true ÚNICAMENTE cuando arriendoMensual, recibosMensuales, horasPorLote y empaqueUnidad ya tengan valores numéricos reales (no null).\n\n"
    . "Responde SIEMPRE en JSON válido con este esquema exacto:\n"
    . "{\n"
    . "  \"respuesta\": \"Tu respuesta conversacional en español para el usuario\",\n"
    . "  \"ingredientesDetectados\": [\n"
    . "    { \"nombre\": \"string\", \"cantidad\": number, \"unidad\": \"g|kg|ml|l|unidad|cucharada|taza\" }\n"
    . "  ],\n"
    . "  \"estadoActualizado\": {\n"
    . "    \"costoIngredientesManual\": number|null,\n"
    . "    \"unidadesManual\": number|null,\n"
    . "    \"arriendoMensual\": number|null,\n"
    . "    \"recibosMensuales\": number|null,\n"
    . "    \"horasPorLote\": number|null,\n"
    . "    \"pagoHoraManoObra\": number|null,\n"
    . "    \"empaqueUnidad\": number|null,\n"
    . "    \"mermaPct\": number|null,\n"
    . "    \"margenSugerido\": number|null\n"
    . "  },\n"
    . "  \"completo\": boolean\n"
    . "}";

// Consultar Ollama Local (http://127.0.0.1:11434/api/chat)
$modelosDisponibles = obtenerModelosOllama();
if (!empty($modelosDisponibles)) {
    $modeloUsar = (!empty($modeloOllama) && in_array($modeloOllama, $modelosDisponibles, true))
        ? $modeloOllama
        : $modelosDisponibles[0];

    $mensajesOllama = [
        ['role' => 'system', 'content' => $promptSistema]
    ];
    foreach (array_slice($historial, -4) as $h) {
        $mensajesOllama[] = [
            'role'    => ($h['rol'] ?? '') === 'usuario' ? 'user' : 'assistant',
            'content' => $h['texto'] ?? ''
        ];
    }
    $mensajesOllama[] = ['role' => 'user', 'content' => $mensaje];

    $payloadOllama = json_encode([
        'model'    => $modeloUsar,
        'messages' => $mensajesOllama,
        'format'   => 'json',
        'stream'   => false,
        'options'  => [
            'temperature' => 0.1,
            'num_ctx'     => 2048,
        ]
    ]);

    $ch = curl_init('http://127.0.0.1:11434/api/chat');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => $payloadOllama,
        CURLOPT_TIMEOUT        => 4,
        CURLOPT_CONNECTTIMEOUT => 2,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code === 200 && $resp) {
        $json = json_decode($resp, true);
        $content = $json['message']['content'] ?? null;
        if ($content) {
            $parsed = json_decode($content, true);
            if (is_array($parsed) && !empty($parsed['respuesta'])) {
                $textoLimpio = mb_strtolower($mensaje, 'UTF-8');
                $mencionaNumeros = preg_match('/\b(\d+|un|dos|tres|cuatro|cinco|medio|mill[oó]n|mil|k)\b/i', $textoLimpio);
                $esCeroOPropio   = preg_match('/\b(casa|propio|propia|no pago|sin arriendo|cero|0)\b/i', $textoLimpio);

                // Guardar montos de arriendo y recibos como valores numéricos literales
                if (isset($parsed['estadoActualizado']['arriendoMensual']) && is_numeric($parsed['estadoActualizado']['arriendoMensual'])) {
                    $parsed['estadoActualizado']['arriendoMensual'] = round(floatval($parsed['estadoActualizado']['arriendoMensual']));
                }

                if (isset($parsed['estadoActualizado']['recibosMensuales']) && is_numeric($parsed['estadoActualizado']['recibosMensuales'])) {
                    $parsed['estadoActualizado']['recibosMensuales'] = round(floatval($parsed['estadoActualizado']['recibosMensuales']));
                }

                // Salvaguarda: Si el usuario NO mencionó números ni dijo 'casa'/'propio'/'sin arriendo',
                // pero la IA inventó un valor para arriendoMensual que antes era null, anularlo y pedir el monto
                if (!$mencionaNumeros && !$esCeroOPropio && ($estado['arriendoMensual'] ?? null) === null) {
                    if (isset($parsed['estadoActualizado']['arriendoMensual']) && $parsed['estadoActualizado']['arriendoMensual'] !== null) {
                        $parsed['estadoActualizado']['arriendoMensual'] = null;
                        $parsed['completo'] = false;
                        if (!preg_match('/(cu[aá]nto|arriendo|alquiler)/i', $parsed['respuesta'])) {
                            $parsed['respuesta'] .= " ¿Cuánto pagas aproximadamente de arriendo mensual por el local?";
                        }
                    }
                }

                // Sanitización estricta de ingredientesDetectados: descartar cualquier alucinación o conceptos de gastos
                $ingredientesFiltrados = [];
                if (!empty($parsed['ingredientesDetectados']) && is_array($parsed['ingredientesDetectados'])) {
                    $palabrasGastos = ['arriendo', 'alquiler', 'local', 'luz', 'gas', 'agua', 'recibo', 'servicio', 'hora', 'minuto', 'tiempo', 'empaque', 'bolsa', 'caja', 'merma', 'sueldo', 'mano de obra', 'salen', 'rinde', 'unidad'];
                    foreach ($parsed['ingredientesDetectados'] as $item) {
                        $nom = mb_strtolower(trim($item['nombre'] ?? ''), 'UTF-8');
                        if (empty($nom)) continue;

                        $esGasto = false;
                        foreach ($palabrasGastos as $p) {
                            if (strpos($nom, $p) !== false) {
                                $esGasto = true;
                                break;
                            }
                        }
                        if ($esGasto) continue;

                        // Verificar que el usuario realmente haya mencionado el nombre del ingrediente en su texto
                        $raiz = mb_substr($nom, 0, 4);
                        if (mb_stripos($textoLimpio, $nom) !== false || (mb_strlen($raiz) >= 4 && mb_stripos($textoLimpio, $raiz) !== false)) {
                            $ingredientesFiltrados[] = $item;
                        }
                    }
                }

                echo json_encode([
                    'status'                 => 'success',
                    'modo'                   => 'ollama',
                    'modelo'                 => $modeloUsar,
                    'respuesta'              => $parsed['respuesta'],
                    'ingredientesDetectados' => $ingredientesFiltrados,
                    'estadoActualizado'      => $parsed['estadoActualizado'] ?? $estado,
                    'completo'               => !empty($parsed['completo']),
                ]);
                exit;
            }
        }
    }
}

echo json_encode([
    'status' => 'fallback_local',
]);
