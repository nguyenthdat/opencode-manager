# db-select-specific

> Select only needed columns; avoid `SELECT *`

## Why It Matters

`SELECT *` fetches all columns, wasting memory, bandwidth, and preventing index-only scans. Specify only the columns you need. This also makes your code robust against schema changes adding large columns (BLOB, TEXT).

## Bad

```php
<?php

declare(strict_types=1);

class ProductController {
    public function list(): JsonResponse {
        $products = Product::all(); // SELECT * — all columns including description TEXT

        return response()->json($products->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'price' => $p->price,
            ];
            // Used 3 columns, fetched 20
        }));
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class ProductController {
    public function list(): JsonResponse {
        $products = Product::query()
            ->select(['id', 'name', 'price', 'image_url'])
            ->where('status', 'active')
            ->get();

        return response()->json($products);
    }

    // Or use API resources to control output
    return ProductResource::collection($products);
}

class ProductResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'price' => (float) $this->price,
        ];
    }
}
```

## See Also

- [db-eager-loading](./db-eager-loading.md)
- [perf-array-over-object](./perf-array-over-object.md)
