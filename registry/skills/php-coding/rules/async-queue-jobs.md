# async-queue-jobs

> Offload heavy work to queues (Redis/RabbitMQ)

## Why It Matters

Heavy processing (image resizing, PDF generation, email sending) blocks the HTTP response cycle. Offload this work to a queue so the user gets a fast response and the work happens asynchronously. Use Laravel Queues, Symfony Messenger, or raw Redis.

## Bad

```php
<?php

declare(strict_types=1);

class RegistrationController {
    public function store(Request $request): Response {
        $user = User::create($request->validated());

        // Blocks the response — user waits 5 seconds
        $this->resizeAvatar($user->avatar);
        $this->generateWelcomePdf($user);
        mail($user->email, 'Welcome!', 'Thank you for registering');

        return response()->json(['message' => 'Registered'], 201);
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

class RegistrationController {
    public function store(Request $request): Response {
        $user = User::create($request->validated());

        // Dispatch jobs — response returns immediately
        ResizeAvatar::dispatch($user);
        GenerateWelcomePdf::dispatch($user);
        SendWelcomeEmail::dispatch($user)->delay(now()->addMinutes(1));

        return response()->json(['message' => 'Registered'], 201);
    }
}

// Job class
class ResizeAvatar implements ShouldQueue {
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private User $user) {}

    public function handle(): void {
        Image::make($this->user->avatar)
            ->resize(300, 300)
            ->save();
    }
}
```

## See Also

- [async-worker-pool](./async-worker-pool.md)
- [async-retry-exponential](./async-retry-exponential.md)
