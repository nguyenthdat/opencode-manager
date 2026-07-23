# test-turbine-flow-testing

> Use Turbine to assert on `Flow` emissions in tests

## Why It Matters

Manually collecting a `Flow` into a `List` with `toList()` only works for flows that complete, and hand-rolling a `Job` + `Channel` to assert on an infinite/hot flow's emissions is verbose and easy to get subtly wrong (missed cancellation, races on collection start). Turbine's `test { }` extension gives a small, purpose-built API (`awaitItem`, `awaitComplete`, `expectNoEvents`, `cancelAndIgnoreRemainingEvents`) for asserting on emissions step by step, with built-in leak detection.

## Bad

```kotlin
@Test
fun `emits loading then success`() = runTest {
    val emissions = mutableListOf<UiState>()
    val job = launch { viewModel.state.toList(emissions) }
    viewModel.load()
    advanceUntilIdle()
    job.cancel()
    assertEquals(listOf(UiState.Loading, UiState.Success("data")), emissions)
}
```

## Good

```kotlin
import app.cash.turbine.test
import kotlinx.coroutines.test.runTest

class UserViewModelTest {
    @Test
    fun `emits loading then success`() = runTest {
        viewModel.state.test {
            assertEquals(UiState.Loading, awaitItem())
            viewModel.load()
            assertEquals(UiState.Success("data"), awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }
}
```

## Asserting No Further Emissions

```kotlin
@Test
fun `does not emit again after cancellation`() = runTest {
    repository.userUpdates.test {
        assertEquals(User("Alice"), awaitItem())
        cancelAndConsumeRemainingEvents()
        expectNoEvents()
    }
}
```

## Testing SharedFlow Events and Errors

```kotlin
@Test
fun `propagates the repository error as a Flow exception`() = runTest {
    coEvery { repository.fetchUser(1) } throws IOException("network down")

    viewModel.userFlow(1).test {
        val error = awaitError()
        assertTrue(error is IOException)
    }
}
```

Turbine automatically fails the test if the flow under test has unconsumed emissions left over when the `test { }` block ends, which catches subtle over-emission bugs that a manual `toList()` collector wouldn't surface.

## See Also

- [`flow-stateflow-ui-state`](flow-stateflow-ui-state.md) - `StateFlow` as a common subject under test
- [`test-runtest-coroutines`](test-runtest-coroutines.md) - the coroutine test scope Turbine's `test { }` runs inside
- [`flow-sharedflow-events`](flow-sharedflow-events.md) - one-shot event flows commonly tested with Turbine
