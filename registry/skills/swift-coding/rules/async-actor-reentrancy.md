# async-actor-reentrancy

> Design actor methods for reentrancy safety across awaits

## Why It Matters

An actor only guarantees exclusive execution *between* suspension points — once a method hits an `await`, the actor is free to run another call (including a re-entrant call to the same method) before the first one resumes. This means state you read before an `await` can be stale by the time execution resumes after it, a subtle bug class unique to actors that doesn't exist in single-threaded code or fully-locked classes.

## Bad

```swift
actor TicketBooth {
    private var availableSeats = 10

    func book(_ count: Int) async throws -> Confirmation {
        guard availableSeats >= count else {
            throw BookingError.notEnoughSeats
        }
        // Suspension point: another `book` call can interleave here and
        // also pass the guard above before this one updates availableSeats,
        // over-booking the seats.
        let confirmation = try await paymentGateway.charge(count)
        availableSeats -= count
        return confirmation
    }
}
```

## Good

```swift
actor TicketBooth {
    private var availableSeats = 10
    private var pendingReservations = 0

    func book(_ count: Int) async throws -> Confirmation {
        // Reserve synchronously, before any await, so re-entrant calls
        // see the updated (reserved) count immediately.
        guard availableSeats - pendingReservations >= count else {
            throw BookingError.notEnoughSeats
        }
        pendingReservations += count
        defer { pendingReservations -= count }

        do {
            let confirmation = try await paymentGateway.charge(count)
            availableSeats -= count
            return confirmation
        } catch {
            throw error   // pendingReservations is released by defer either way
        }
    }
}
```

## General Pattern: Re-Validate After Every Await

```swift
actor Downloader {
    private var cache: [URL: Data] = [:]

    func data(for url: URL) async throws -> Data {
        if let cached = cache[url] { return cached }

        let fetched = try await network.fetch(url)

        // Re-check after the await: another reentrant call may have
        // already populated the cache while this one was suspended.
        if let cached = cache[url] { return cached }
        cache[url] = fetched
        return fetched
    }
}
```

Treat every `await` inside an actor method as a point where the world can change underneath you — re-validate invariants afterward rather than assuming state is exactly as you left it before suspending.

## See Also

- [`async-actor-isolated-state`](async-actor-isolated-state.md) - the baseline isolation guarantee actors provide
- [`async-task-cancellation-check`](async-task-cancellation-check.md) - cancellation is another thing that can change state across an await
- [`err-defer-cleanup`](err-defer-cleanup.md) - defer used here to release a reservation reliably
