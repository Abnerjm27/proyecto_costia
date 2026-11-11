<?php
/**
 * Session.php — Gestión centralizada y endurecida de sesiones PHP (OWASP / GDPR)
 *
 * Configura cookies de sesión HttpOnly y SameSite=Lax para prevenir ataques
 * de secuestro de sesión (XSS) y falsificación de peticiones en sitios cruzados (CSRF).
 */

class Session {
    /**
     * Inicia la sesión PHP aplicando las directivas de seguridad recomendadas por OWASP
     * y configurando cabeceras globales para mitigar Clickjacking, MIME-Sniffing y fugas de referencia.
     */
    public static function iniciar(): void {
        if (!headers_sent()) {
            header('X-Frame-Options: SAMEORIGIN');
            header('X-Content-Type-Options: nosniff');
            header('Referrer-Policy: strict-origin-when-cross-origin');
        }

        if (session_status() === PHP_SESSION_NONE) {
            if (!headers_sent()) {
                $esHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
                    || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);

                session_set_cookie_params([
                    'lifetime' => 86400 * 7, // 7 días
                    'path'     => '/',
                    'httponly' => true,      // No accesible mediante JavaScript (mitiga XSS)
                    'samesite' => 'Lax',     // Previene ataques CSRF
                    'secure'   => $esHttps   // Solo por HTTPS cuando esté disponible
                ]);
            }
            session_start();
        }
    }

    /**
     * Destruye de forma segura la sesión y sus cookies asociadas.
     */
    public static function destruir(): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"] ?? '',
                $params["secure"] ?? false,
                $params["httponly"] ?? true
            );
        }
        session_destroy();
    }
}

