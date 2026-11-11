<?php
/**
 * session.php — Endpoint para verificar el estado de la sesión activa
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/Session.php';
Session::iniciar();

if (!empty($_SESSION['usuario_id'])) {
    echo json_encode([
        'autenticado' => true,
        'usuario' => [
            'id'      => (int)$_SESSION['usuario_id'],
            'negocio' => $_SESSION['negocio'] ?? 'Mi Negocio',
            'email'   => $_SESSION['email'] ?? '',
        ]
    ]);
} else {
    echo json_encode([
        'autenticado' => false,
        'usuario'     => null,
    ]);
}
