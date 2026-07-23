# test-runtest-coroutines

> Use `runTest` to test suspend functions and coroutine code

## Why It Matters

A `suspend fun` can't be called from a regular `@Test` method without a coroutine scope, and naively wrapping it in `runBlocking` executes on real wall-clock time — a test that calls `delay(10_000)` will actually take ten seconds. `runTest` from `kotlinx-coroutines-test` provides a `TestScope` with a virtual-time scheduler, so delays are skipped instantly while still executing every suspension point.

## Bad

```kotlin
@Test
fun `fetches user and caches result`() = runBlocking {
    val result = userRepository.fetchUser(1)   // real network/delay time
    assertEquals("Alice", result.name)
}
```

## Good

```kotlin
import kotlinx.coroutines.test.runTest

class UserRepositoryTest {
    @Test
    fun `fetches user and caches result`() = runTest {
        val result = userRepository.fetchUser(1)
        assertEquals("Alice", result.name)
    }

    @Test
    fun `retry backs off between attempts without slowing down the test`() = runTest {
        val result = flakyClient.fetchWithRetry() // internally delay()s between retries
        assertTrue(result.isSuccess)
        // test completes instantly even though the delays would be seconds in real time
    }
}
```

## Asserting on Elapsed Virtual Time

```kotlin
@Test
fun `retries three times with exponential backoff`() = runTest {
    val client = FlakyClient(failuresBeforeSuccess = 2)

    client.fetchWithRetry()

    // currentTime reflects virtual time advanced by delay(), not wall-clock time
    assertEquals(300L, currentTime) // e.g. 100ms + 200ms backoff
}
```

## Structured Concurrency Inside Tests

```kotlin
@Test
fun `two concurrent fetches both complete`() = runTest {
    val (a, b) = awaitAll(
        async { userRepository.fetchUser(1) },
        async { userRepository.fetchUser(2) },
    )
    assertEquals(listOf("Alice", "Bob"), listOf(a.name, b.name))
}
```

`runTest` fails the test if any child coroutine it launched is still active when the test body returns, catching leaked coroutines automatically — something `runBlocking` never checks.

## See Also

- [`test-testdispatcher-virtual-time`](test-testdispatcher-virtual-time.md) - the virtual-time scheduler underlying `runTest`
- [`async-structured-concurrency`](async-structured-concurrency.md) - why leaked children fail the test
- [`test-turbine-flow-testing`](test-turbine-flow-testing.md) - testing `Flow` emissions inside `runTest`
