<?php
/**
 * Usuario.php
 * Modelo de entidad que representa a un usuario en el sistema.
 */

class Usuario {
    private ?int $id;
    private string $negocio;
    private string $email;
    private string $password;

    public function __construct(string $negocio, string $email, string $password = '', ?int $id = null) {
        $this->id       = $id;
        $this->negocio  = trim($negocio);
        $this->email    = trim($email);
        $this->password = $password;
    }

    // Getters y Setters
    public function getId(): ?int {
        return $this->id;
    }

    public function getNegocio(): string {
        return $this->negocio;
    }

    public function setNegocio(string $negocio): void {
        $this->negocio = trim($negocio);
    }

    public function getEmail(): string {
        return $this->email;
    }

    public function setEmail(string $email): void {
        $this->email = trim($email);
    }

    public function getPassword(): string {
        return $this->password;
    }

    public function setPassword(string $password): void {
        $this->password = $password;
    }

    // Métodos de negocio y seguridad
    public function hashearPassword(): void {
        $this->password = password_hash($this->password, PASSWORD_BCRYPT);
    }

    public function verificarPassword(string $plainPassword): bool {
        return password_verify($plainPassword, $this->password);
    }

    public function toArray(): array {
        return [
            'id'      => $this->id,
            'negocio' => $this->negocio,
            'email'   => $this->email,
        ];
    }
}
