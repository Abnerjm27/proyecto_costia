<?php
/**
 * RecetaItem.php
 * Modelo que representa un ingrediente/insumo dentro de la receta de un producto.
 */

class RecetaItem {
    private ?int $id;
    private int $productoId;
    private int $insumoId;
    private float $cantidad;
    private string $unidadReceta;
    private ?string $insumoNombre;
    private ?float $insumoPrecio;
    private ?string $insumoUnidad;

    public function __construct(
        int $insumoId,
        float $cantidad,
        string $unidadReceta,
        int $productoId = 0,
        ?int $id = null,
        ?string $insumoNombre = null,
        ?float $insumoPrecio = null,
        ?string $insumoUnidad = null
    ) {
        $this->id           = $id;
        $this->productoId   = $productoId;
        $this->insumoId     = $insumoId;
        $this->cantidad     = max(0.0, $cantidad);
        $this->unidadReceta = trim($unidadReceta);
        $this->insumoNombre = $insumoNombre;
        $this->insumoPrecio = $insumoPrecio;
        $this->insumoUnidad = $insumoUnidad;
    }

    public function getId(): ?int {
        return $this->id;
    }

    public function getProductoId(): int {
        return $this->productoId;
    }

    public function setProductoId(int $productoId): void {
        $this->productoId = $productoId;
    }

    public function getInsumoId(): int {
        return $this->insumoId;
    }

    public function getCantidad(): float {
        return $this->cantidad;
    }

    public function getUnidadReceta(): string {
        return $this->unidadReceta;
    }

    public function getInsumoNombre(): ?string {
        return $this->insumoNombre;
    }

    public function toArray(): array {
        return [
            'id'            => $this->id,
            'producto_id'   => $this->productoId,
            'insumoId'      => $this->insumoId,
            'cantidad'      => $this->cantidad,
            'unidadReceta'  => $this->unidadReceta,
            'insumo_nombre' => $this->insumoNombre,
            'insumo_precio' => $this->insumoPrecio,
            'insumo_unidad' => $this->insumoUnidad,
        ];
    }
}
