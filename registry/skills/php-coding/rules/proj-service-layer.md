# proj-service-layer

> Separate service/business layer from controllers

## Why It Matters

Controllers should handle HTTP concerns (request parsing, response formatting, HTTP status codes). Business logic belongs in service classes. This separation enables reuse across controllers, commands, and queues, and makes business logic independently testable.

## Bad

```php
<?php

declare(strict_types=1);

class OrderController {
    public function place(Request $request): JsonResponse {
        $order = new Order();
        $order->user_id = auth()->id();
        $order->total = 0;
        $order->save();

        foreach ($request->input('items') as $item) {
            $product = Product::find($item['product_id']);
            if (!$product || $product->stock < $item['quantity']) {
                return response()->json(['error' => 'Out of stock'], 422);
            }
            $orderItem = new OrderItem();
            $orderItem->order_id = $order->id;
            $orderItem->product_id = $product->id;
            $orderItem->quantity = $item['quantity'];
            $orderItem->price = $product->price;
            $orderItem->save();
            $order->total += $product->price * $item['quantity'];
        }
        $order->save();

        return response()->json($order, 201);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class OrderController {
    public function __construct(private OrderService $orderService) {}

    public function place(PlaceOrderRequest $request): JsonResponse {
        try {
            $order = $this->orderService->placeOrder(
                userId: auth()->id(),
                items: $request->items(),
            );
            return response()->json(new OrderResource($order), 201);
        } catch (OutOfStockException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}

class OrderService {
    public function __construct(private InventoryManager $inventory) {}

    /** @param OrderItemInput[] $items */
    public function placeOrder(int $userId, array $items): Order {
        return DB::transaction(function () use ($userId, $items) {
            $order = Order::create(['user_id' => $userId, 'total' => 0]);
            $total = 0;
            foreach ($items as $item) {
                $price = $this->inventory->reserve($item->productId, $item->quantity);
                $order->items()->create([
                    'product_id' => $item->productId,
                    'quantity' => $item->quantity,
                    'price' => $price,
                ]);
                $total += $price * $item->quantity;
            }
            $order->update(['total' => $total]);
            return $order;
        });
    }
}
```

## See Also

- [proj-action-pattern](./proj-action-pattern.md)
- [oop-single-responsibility](./oop-single-responsibility.md)
