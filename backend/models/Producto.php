<?php
/**
 * Producto.php
 * Modelo que representa un producto terminado con su configuración de costeo gastronómico y receta.
 */

require_once __DIR__ . '/RecetaItem.php';

class Producto {
    private ?int $id;
    private int $usuarioId;
    private string $nombre;
    private string $modo;
    private float $valorModo;
    private string $tipoMargen;
    private int $unidadesProducidas;
    private float $costoEmpaque;
    private float $porcentajeMerma;
    private float $costoManoObra;
    private ?float $precioVentaAnterior;
    private ?float $costoSnapshot;
    /** @var RecetaItem[] */
    private array $receta;

    public function __construct(
        string $nombre,
        string $modo = 'margen',
        float $valorModo = 30.0,
        string $tipoMargen = 'costo',
        int $unidadesProducidas = 1,
        float $costoEmpaque = 0.0,
        float $porcentajeMerma = 0.0,
        float $costoManoObra = 0.0,
        array $receta = [],
        int $usuarioId = 0,
        ?int $id = null,
        ?float $precioVentaAnterior = null,
        ?float $costoSnapshot = null
    ) {
        $this->id                  = $id;
        $this->usuarioId           = $usuarioId;
        $this->nombre              = trim($nombre);
        $this->modo                = $modo === 'multiplicador' ? 'multiplicador' : 'margen';
        $this->valorModo           = max(0.0, $valorModo);
        $this->tipoMargen          = $tipoMargen === 'venta' ? 'venta' : 'costo';
        $this->unidadesProducidas  = max(1, $unidadesProducidas);
        $this->costoEmpaque        = max(0.0, $costoEmpaque);
        $this->porcentajeMerma     = max(0.0, $porcentajeMerma);
        $this->costoManoObra       = max(0.0, $costoManoObra);
        $this->receta              = $receta;
        $this->precioVentaAnterior = $precioVentaAnterior;
        $this->costoSnapshot       = $costoSnapshot;
    }

    public function getId(): ?int {
        return $this->id;
    }

    public function getUsuarioId(): int {
        return $this->usuarioId;
    }

    public function getNombre(): string {
        return $this->nombre;
    }

    public function getModo(): string {
        return $this->modo;
    }

    public function getValorModo(): float {
        return $this->valorModo;
    }

    public function getTipoMargen(): string {
        return $this->tipoMargen;
    }

    public function getUnidadesProducidas(): int {
        return $this->unidadesProducidas;
    }

    public function getCostoEmpaque(): float {
        return $this->costoEmpaque;
    }

    public function getPorcentajeMerma(): float {
        return $this->porcentajeMerma;
    }

    public function getCostoManoObra(): float {
        return $this->costoManoObra;
    }

    public function getPrecioVentaAnterior(): ?float {
        return $this->precioVentaAnterior;
    }

    public function getCostoSnapshot(): ?float {
        return $this->costoSnapshot;
    }

    /** @return RecetaItem[] */
    public function getReceta(): array {
        return $this->receta;
    }

    public function setReceta(array $receta): void {
        $this->receta = $receta;
    }

    public function toArray(): array {
        return [
            'id'                  => $this->id,
            'usuario_id'          => $this->usuarioId,
            'nombre'              => $this->nombre,
            'modo'                => $this->modo,
            'valorModo'           => $this->valorModo,
            'tipoMargen'          => $this->tipoMargen,
            'unidadesProducidas'  => $this->unidadesProducidas,
            'costoEmpaque'        => $this->costoEmpaque,
            'porcentajeMerma'     => $this->porcentajeMerma,
            'costoManoObra'       => $this->costoManoObra,
            'precioVentaAnterior' => $this->precioVentaAnterior,
            'costoSnapshot'       => $this->costoSnapshot,
            'receta'              => array_map(function ($item) {
                return $item instanceof RecetaItem ? $item->toArray() : $item;
            }, $this->receta),
        ];
    }
}
