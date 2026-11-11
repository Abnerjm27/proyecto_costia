<?php
/**
 * Insumo.php
 * Modelo que representa una materia prima en el sistema.
 */

class Insumo {
    private ?int $id;
    private int $usuarioId;
    private string $nombre;
    private string $unidad;
    private float $precio;

    public function __construct(
        string $nombre,
        string $unidad,
        float $precio,
        int $usuarioId = 0,
        ?int $id = null
    ) {
        $this->id        = $id;
        $this->usuarioId = $usuarioId;
        $this->nombre    = trim($nombre);
        $this->unidad    = trim($unidad);
        $this->precio    = max(0.0, $precio);
    }

    public function getId(): ?int {
        return $this->id;
    }

    public function getUsuarioId(): int {
        return $this->usuarioId;
    }

    public function setUsuarioId(int $usuarioId): void {
        $this->usuarioId = $usuarioId;
    }

    public function getNombre(): string {
        return $this->nombre;
    }

    public function setNombre(string $nombre): void {
        $this->nombre = trim($nombre);
    }

    public function getUnidad(): string {
        return $this->unidad;
    }

    public function setUnidad(string $unidad): void {
        $this->unidad = trim($unidad);
    }

    public function getPrecio(): float {
        return $this->precio;
    }

    public function setPrecio(float $precio): void {
        $this->precio = max(0.0, $precio);
    }

    public function toArray(): array {
        return [
            'id'         => $this->id,
            'usuario_id' => $this->usuarioId,
            'nombre'     => $this->nombre,
            'unidad'     => $this->unidad,
            'precio'     => $this->precio,
        ];
    }
}
