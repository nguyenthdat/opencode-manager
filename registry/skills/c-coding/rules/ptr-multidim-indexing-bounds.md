# ptr-multidim-indexing-bounds

> When flattening multi-dimensional data into a 1D buffer, centralize the index math and bound-check every dimension

## Why It Matters

Flattened 2D/3D buffers (`buf[row * cols + col]`) are common for performance and flexible sizing, but the index arithmetic is easy to get subtly wrong (row/col swapped, wrong stride) and, unlike a true `T[rows][cols]`, the compiler cannot catch an out-of-range row or column for you.

## Bad

```c
double *grid = malloc(rows * cols * sizeof(*grid));

/* Index math duplicated and inconsistent across the file */
grid[y * cols + x] = 1.0;      /* here: row-major with cols stride */
double v = grid[x * rows + y]; /* here: swapped by mistake, wrong stride */
```

## Good

```c
typedef struct {
    double *data;
    size_t  rows, cols;
} grid;

static inline double *grid_at(grid *g, size_t row, size_t col) {
    assert(row < g->rows && col < g->cols);   /* single, consistent bound check */
    return &g->data[row * g->cols + col];
}

grid g = { .data = calloc(rows * cols, sizeof(double)), .rows = rows, .cols = cols };
*grid_at(&g, y, x) = 1.0;
double v = *grid_at(&g, y, x);
```

## Overflow-Safe Size Computation

```c
/* rows * cols can overflow size_t for attacker-controlled dimensions */
if (rows != 0 && cols > SIZE_MAX / rows) {
    return NULL;   /* would overflow */
}
double *data = malloc(rows * cols * sizeof(*data));
```

## See Also

- [ptr-bounds-before-index](ptr-bounds-before-index.md) - General index bound-checking
- [ub-signed-integer-overflow](ub-signed-integer-overflow.md) - Related overflow discussion (use unsigned size_t carefully too)
- [perf-cache-friendly-struct-layout](perf-cache-friendly-struct-layout.md) - Row-major vs column-major layout performance
