# doc-inline-why-not-what

> Write comments that explain why, not what the code already says

## Why It Matters

A comment that restates the code (`// increment count` above `count++`) adds zero information and rots the moment the code changes underneath it, since nothing forces the comment to stay in sync. A comment explaining *why* — the non-obvious constraint, workaround, or business rule that motivated this particular line — captures context the code itself can never express, no matter how clearly it's written.

## Bad

```kotlin
// Loop through all users
for (user in users) {
    // Check if user is active
    if (user.isActive) {
        // Add user to the list
        activeUsers.add(user)
    }
}

// Set timeout to 30000
val timeoutMs = 30_000
```

## Good

```kotlin
for (user in users) {
    if (user.isActive) {
        activeUsers.add(user)
    }
}

// 30s matches the load balancer's upstream timeout; raising this without also
// raising the LB config just moves the failure from us to the client instead of fixing it.
val timeoutMs = 30_000
```

## Documenting Non-Obvious Workarounds

```kotlin
// Retry once on ECONNRESET: the payment provider's LB occasionally drops idle
// keep-alive connections mid-request (see incident INC-4821). A single retry
// is sufficient because the request is idempotent via the Idempotency-Key header.
if (error is ConnectionResetException && attempt == 0) {
    return chargeCard(request, attempt = 1)
}
```

## When "What" Comments Are Still Useful

```kotlin
// Bit-packing layout: [flags: 4 bits][version: 4 bits][payload: 24 bits]
val header = (flags shl 28) or (version shl 24) or payload
```

Dense, non-idiomatic code (bit manipulation, regex, numerically-tuned algorithms) is a legitimate exception — a short "what" comment can be the fastest way to make otherwise opaque code scannable, even though it restates the code, because the code alone doesn't read naturally.

## See Also

- [`doc-kdoc-public-api`](doc-kdoc-public-api.md) - the complementary rule for documenting the public contract, not internals
- [`name-no-hungarian-notation`](name-no-hungarian-notation.md) - preferring clear names over comments for what code already says
- [`anti-magic-numbers`](anti-magic-numbers.md) - named constants as another way to make "why" self-evident
