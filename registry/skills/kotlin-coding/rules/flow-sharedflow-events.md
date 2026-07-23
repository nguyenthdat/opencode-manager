# flow-sharedflow-events

> Model one-off events with `SharedFlow`, not `StateFlow`

## Why It Matters

`StateFlow` conflates values and always replays its latest one to new subscribers, which is wrong for one-off events like "show this toast" or "navigate to this screen" — a late subscriber would replay a stale event, and two identical consecutive events (the same error message twice) would be collapsed into one by `StateFlow`'s equality check. `SharedFlow`, configured with no replay, delivers each event exactly once to currently-active collectors.

## Bad

```kotlin
class LoginViewModel {
    // BAD: StateFlow replays the last "event" to every new collector, e.g. re-navigating
    // on rotation, and silently drops a second identical error in a row
    private val _navigationEvent = MutableStateFlow<NavEvent?>(null)
    val navigationEvent: StateFlow<NavEvent?> = _navigationEvent.asStateFlow()

    fun onLoginClicked() {
        _navigationEvent.value = NavEvent.ToHome
    }
}
```

## Good

```kotlin
class LoginViewModel(private val scope: CoroutineScope) {
    private val _navigationEvent = MutableSharedFlow<NavEvent>(
        replay = 0,
        extraBufferCapacity = 1, // avoid suspending emit() on a slow/absent collector
    )
    val navigationEvent: SharedFlow<NavEvent> = _navigationEvent.asSharedFlow()

    fun onLoginClicked() {
        scope.launch {
            _navigationEvent.emit(NavEvent.ToHome)
        }
    }
}

// Collector consumes each event exactly once, no replay on re-subscription
scope.launch {
    viewModel.navigationEvent.collect { event -> navigate(event) }
}
```

## Tuning Replay and Buffer

- `replay = 0`: no history for new subscribers — correct default for events.
- `extraBufferCapacity`: how many emissions can queue up before `emit()` suspends the emitter; set > 0 so a UI briefly not collecting (e.g. mid-configuration-change) doesn't block emission.
- `onBufferOverflow`: `SUSPEND` (default), `DROP_OLDEST`, or `DROP_LATEST` — choose based on whether losing an event is acceptable.

```kotlin
MutableSharedFlow<Analytics>(
    extraBufferCapacity = 64,
    onBufferOverflow = BufferOverflow.DROP_OLDEST, // analytics: OK to drop under pressure
)
```

## See Also

- [`flow-stateflow-ui-state`](flow-stateflow-ui-state.md) - the correct tool for durable, replayable state
- [`flow-cold-vs-hot`](flow-cold-vs-hot.md) - background on hot flow semantics
- [`flow-statein-sharein`](flow-statein-sharein.md) - shareIn as a way to derive a SharedFlow from a cold source
