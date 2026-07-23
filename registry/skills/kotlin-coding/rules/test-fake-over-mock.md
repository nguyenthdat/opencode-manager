# test-fake-over-mock

> Prefer a hand-written fake over a mock when behavior needs to be realistic

## Why It Matters

A mock only returns exactly what you stub it to return, so a test built on mocks can pass even when the mocked collaborator's *actual* invariants (uniqueness constraints, ordering, state transitions) would have caught the bug. A fake — a lightweight real implementation, e.g. an in-memory repository backed by a `MutableMap` — enforces those invariants for real, catching bugs that over-specified mock expectations would silently let through.

## Bad

```kotlin
@Test
fun `saving a user twice with the same id overwrites it`() {
    val repository = mockk<UserRepository>()
    every { repository.save(any()) } just Runs
    every { repository.findById("1") } returns User("1", "Alice")
    // This "passes" no matter what save() actually does with duplicate ids —
    // the mock can't verify overwrite semantics, only that save() was called.
    repository.save(User("1", "Alice"))
    repository.save(User("1", "Alicia"))
    assertEquals("Alicia", repository.findById("1")?.name)
}
```

## Good

```kotlin
class InMemoryUserRepository : UserRepository {
    private val users = mutableMapOf<String, User>()

    override fun save(user: User) {
        users[user.id] = user // real overwrite semantics
    }

    override fun findById(id: String): User? = users[id]
}

@Test
fun `saving a user twice with the same id overwrites it`() {
    val repository = InMemoryUserRepository()

    repository.save(User("1", "Alice"))
    repository.save(User("1", "Alicia"))

    assertEquals("Alicia", repository.findById("1")?.name)
}
```

## When a Mock Is Still the Right Tool

```kotlin
@Test
fun `sends exactly one payment request to the gateway`() {
    val gateway = mockk<PaymentGateway>()
    coEvery { gateway.charge(any()) } returns ChargeResult.Success("txn_1")

    billingService.processPayment(100.0)

    coVerify(exactly = 1) { gateway.charge(100.0) } // verifying interaction, not state
}
```

Use a mock when the test is genuinely about *interaction* (was this external side-effecting call made, with what arguments, how many times) — for a real third-party gateway, database driver, or anything you can't feasibly reimplement, a mock is appropriate. Reach for a fake when the test is about *state and behavior* of a collaborator you own and can model faithfully in-memory.

## See Also

- [`test-mockk-over-mockito`](test-mockk-over-mockito.md) - the mocking library to use for the interaction-testing cases
- [`test-fixture-builders`](test-fixture-builders.md) - constructing realistic data for fakes to operate on
- [`api-interface-default-methods`](api-interface-default-methods.md) - designing interfaces that are easy to fake
