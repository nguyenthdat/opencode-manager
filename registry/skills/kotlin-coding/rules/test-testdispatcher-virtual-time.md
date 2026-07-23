# test-testdispatcher-virtual-time

> Use `TestDispatcher`/virtual time to make coroutine tests deterministic

## Why It Matters

Coroutine tests that rely on real dispatchers are flaky under load — a `Dispatchers.Default`-backed test can race and produce different orderings on a busy CI runner than on a laptop. `TestDispatcher` (via `StandardTestDispatcher` or the one built into `runTest`) gives every coroutine a single, controllable virtual-time scheduler, making ordering and timing fully deterministic and reproducible.

## Bad

```kotlin
@Test
fun `debounced search emits only the last query`() = runBlocking {
    val viewModel = SearchViewModel(dispatcher = Dispatchers.Default)
    viewModel.onQueryChanged("k")
    viewModel.onQueryChanged("ko")
    viewModel.onQueryChanged("kotlin")
    delay(500) // hope the debounce window has passed by now
    assertEquals("kotlin", viewModel.lastSearched)
}
```

## Good

```kotlin
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.advanceUntilIdle

@Test
fun `debounced search emits only the last query`() = runTest {
    val dispatcher = StandardTestDispatcher(testScheduler)
    val viewModel = SearchViewModel(dispatcher = dispatcher)

    viewModel.onQueryChanged("k")
    viewModel.onQueryChanged("ko")
    viewModel.onQueryChanged("kotlin")
    advanceUntilIdle() // deterministically runs every pending coroutine to completion

    assertEquals("kotlin", viewModel.lastSearched)
}
```

## Controlling Time Step by Step

```kotlin
@Test
fun `shows loading indicator only after 200ms`() = runTest {
    val viewModel = SearchViewModel(dispatcher = StandardTestDispatcher(testScheduler))

    viewModel.onQueryChanged("kotlin")
    advanceTimeBy(199) // just before the threshold
    assertFalse(viewModel.isLoading)

    advanceTimeBy(2) // now past 200ms
    assertTrue(viewModel.isLoading)
}
```

## Injecting Dispatchers for Testability

```kotlin
class SearchViewModel(
    private val dispatcher: CoroutineDispatcher = Dispatchers.Default,
) {
    private val scope = CoroutineScope(dispatcher + SupervisorJob())
    // ...
}
```

Production classes must accept an injectable `CoroutineDispatcher` (defaulting to a real one) rather than hardcoding `Dispatchers.Default`/`Dispatchers.IO`, or tests have no way to substitute the `TestDispatcher`.

## See Also

- [`test-runtest-coroutines`](test-runtest-coroutines.md) - the entry point that provides the default test scheduler
- [`async-dispatchers-choice`](async-dispatchers-choice.md) - choosing production dispatchers that remain injectable
- [`flow-statein-sharein`](flow-statein-sharein.md) - `stateIn`/`shareIn` operators commonly tested with virtual time
