# Seam Placement and Testability

A seam is a place where behaviour can be changed without editing the code at that location. In testable design, every external dependency (database, network, clock, filesystem, randomness) should sit behind a seam so the test can supply a controlled replacement. This reference bridges codebase-design's seam vocabulary with concrete, per-language testability patterns.

## The Seam-as-Contract Framework

Every seam is a contract between the module and its callers. The contract includes:

1. **Interface**: the type-level surface (function signatures, trait/protocol/interface methods).
2. **Invariants**: behaviour guarantees the production implementation upholds and the test replacement must also uphold.
3. **Error model**: what errors the seam can produce and what the caller must handle.
4. **Resource model**: who allocates, who frees, whether the replacement must implement cleanup.
5. **Performance model**: whether the seam implies I/O, latency, or allocation that the test replacement should avoid.

A test replacement that violates any of these is a broken seam — tests that pass against a broken fake are giving false confidence.

## When to Cut a Seam

| Situation | Action |
|---|---|
| The module calls an external system (database, HTTP API, message queue, filesystem) | **Cut a seam.** The seam is the interface that abstracts that external call. |
| The module needs the current time or random values | **Cut a seam.** Use a `Clock` or `Rng` interface. |
| The module does heavy computation that's tested independently | **No seam needed.** Test through the public interface; the computation is internal. |
| Two internal modules communicate | **Maybe a seam.** Cut one only if they vary independently and have separate test suites. |
| The module logs | **Seam only if log content matters to correctness.** Otherwise, capture logs in test via the language's log-capture mechanism, not a seam. |

**One-adapter rule**: do not cut a seam for a dependency that has only one production implementation and no near-term plan for a second. A `trait`/`interface` with exactly one `impl` that exists only so tests can mock it is valid IF tests are the second implementation. But if tests never replace it either, it's dead abstraction.

## Per-Language Seam Patterns

### Rust

**Seam as trait**:
```rust
pub trait Clock: Send + Sync {
    fn now(&self) -> Instant;
}

pub struct RealClock;
impl Clock for RealClock { fn now(&self) -> Instant { Instant::now() } }

pub struct FakeClock(Mutex<Instant>);
impl Clock for FakeClock { fn now(&self) -> Instant { *self.0.lock().unwrap() } }
impl FakeClock { pub fn advance(&self, d: Duration) { *self.0.lock().unwrap() += d; } }

// In production: MyService::new(RealClock)
// In test: MyService::new(FakeClock::default())
```

**Seam as generic parameter** (zero-cost abstraction):
```rust
pub struct Service<C: Clock> { clock: C }
// In production: Service<RealClock>
// In test: Service<FakeClock>
```

**Choice**: trait object (`dyn Clock`) for open/runtime-selected implementations, generic for closed/compile-time. Prefer generic in libraries (callers choose dispatch); use trait object in applications that store one runtime-selected impl at the composition root.

**Test-only visibility**: `#[cfg(test)]` for test utilities. Never put test seams in production `cfg`.

---

### TypeScript / JavaScript

**Seam as interface + dependency injection**:
```typescript
interface Clock {
  now(): Date;
}

class RealClock implements Clock {
  now() { return new Date(); }
}

class FakeClock implements Clock {
  private current: Date;
  constructor(start: Date) { this.current = start; }
  now() { return this.current; }
  advance(ms: number) { this.current = new Date(this.current.getTime() + ms); }
}

class Service {
  constructor(private clock: Clock) {}
}
```

**Seam as module mock** (Jest/Vitest):
```typescript
// Prefer DI seam over module mock. Module mocks couple tests to file paths,
// are fragile under refactoring, and hide the contract from the type system.
// Only use when you don't control the module (e.g., third-party library).
jest.mock('./clock', () => ({ now: () => new Date('2024-01-01') }));
```

**Choice**: DI constructor seam for your own code. Module mock only for third-party code you cannot change.

---

### Python

**Seam as protocol/ABC**:
```python
from typing import Protocol

class Clock(Protocol):
    def now(self) -> float: ...

class RealClock:
    def now(self) -> float: return time.time()

class FakeClock:
    def __init__(self, start: float = 0.0) -> None:
        self._now = start
    def now(self) -> float: return self._now
    def advance(self, seconds: float) -> None:
        self._now += seconds

class Service:
    def __init__(self, clock: Clock) -> None: ...
```

**Seam as `unittest.mock`**:
```python
from unittest.mock import patch

# Prefer DI over patch. patch couples tests to import paths and
# silently changes behaviour the type checker cannot see.
# Use only for third-party code.
with patch('mymodule.time.time', return_value=1000.0):
    service.do_thing()
```

**Choice**: `Protocol` (structural subtyping, no explicit inheritance) for your own contracts. `patch` only for third-party code. `pytest-mock` for fixture-based injection.

---

### Go

**Seam as interface**:
```go
type Clock interface {
    Now() time.Time
}

type RealClock struct{}
func (RealClock) Now() time.Time { return time.Now() }

type FakeClock struct {
    t time.Time
}
func (c *FakeClock) Now() time.Time { return c.t }
func (c *FakeClock) Advance(d time.Duration) { c.t = c.t.Add(d) }

type Service struct {
    clock Clock
}
```

**Interface ownership rule**: the consumer defines the interface, not the producer. `Service` defines `Clock` with exactly the methods it needs. The real clock may have 50 methods; the interface has 1.

**Test files**: `service_test.go` in the same package for white-box, `service_test` package suffix for black-box (tests through the public API only). Prefer black-box.

---

### C# / .NET

**Seam as interface**:
```csharp
public interface IClock
{
    DateTime Now { get; }
}

public class RealClock : IClock
{
    public DateTime Now => DateTime.UtcNow;
}

public class FakeClock : IClock
{
    public DateTime Now { get; set; } = DateTime.UtcNow;
}
```

**Mocking**: Moq, NSubstitute, or FakeItEasy. Prefer hand-written fakes over mocking frameworks for non-trivial behaviour — a hand-written fake documents the contract; a mock setup is local to one test and goes stale silently.

---

### Kotlin

**Seam as interface**:
```kotlin
interface Clock {
    fun now(): Instant
}

class RealClock : Clock {
    override fun now() = Instant.now()
}

class FakeClock(private var time: Instant = Instant.now()) : Clock {
    override fun now() = time
    fun advance(d: Duration) { time += d }
}
```

---

### Java

**Seam as interface**:
```java
public interface Clock {
    Instant now();
}

public class RealClock implements Clock {
    public Instant now() { return Instant.now(); }
}

public class FakeClock implements Clock {
    private Instant time = Instant.now();
    public Instant now() { return time; }
    public void advance(Duration d) { time = time.plus(d); }
}
```

---

### C

**Seam as function pointer**:
```c
typedef struct {
    double (*now)(void* ctx);
    void* ctx;
} Clock;

double real_now(void* ctx) { (void)ctx; return get_current_time(); }

typedef struct { double t; } FakeClock;
double fake_now(void* ctx) { return ((FakeClock*)ctx)->t; }
```

**Pitfalls**: no type safety across the `void*`. The `ctx` must outlive the function pointer. Caller must manually ensure correct pairing of function pointer and context.

**Better C pattern — vtable**:
```c
typedef struct ClockVtable {
    double (*now)(void* impl);
    void (*destroy)(void* impl);
} ClockVtable;

typedef struct { ClockVtable* vtable; void* impl; } Clock;
// Clock is a fat pointer (vtable + impl).
// Callers use Clock*; implementers provide Vtable + impl.
```

---

### C++

**Seam as abstract base** (virtual dispatch):
```cpp
class Clock {
public:
    virtual ~Clock() = default;
    virtual std::chrono::steady_clock::time_point now() const = 0;
};

class RealClock : public Clock { /* ... */ };
class FakeClock : public Clock { /* ... */ };
```

**Seam as template** (compile-time dispatch):
```cpp
template <typename ClockT>
class Service {
    ClockT clock;
public:
    explicit Service(ClockT c) : clock(std::move(c)) {}
};
```

**Choice**: template for libraries (zero overhead, choice stays with caller). Virtual for applications (store one runtime-selected impl). PIMPL to hide the template from headers.

---

### Swift

**Seam as protocol**:
```swift
protocol Clock: Sendable {
    func now() -> Date
}

struct RealClock: Clock {
    func now() -> Date { Date() }
}

final class FakeClock: Clock, @unchecked Sendable {
    private var time: Date
    func now() -> Date { time }
    func advance(_ d: TimeInterval) { time.addTimeInterval(d) }
}
```

---

### Zig

**Seam as comptime-generic or function pointer**:
```zig
const Clock = struct {
    nowFn: *const fn (*anyopaque) u64,
    ctx: *anyopaque,
};
```
Zig's comptime allows generic instantiation without runtime dispatch overhead. Prefer comptime generics for testability when the set of implementations is known at compile time.

---

### Lua

**Seam as table of functions**:
```lua
local RealClock = { now = os.time }

local FakeClock = { _t = 0 }
function FakeClock:now() return self._t end
function FakeClock:advance(sec) self._t = self._t + sec end

local Service = {}
function Service.new(clock) return { clock = clock } end
```

---

### Ruby

**Seam as duck-typed dependency injection**:
```ruby
class RealClock
  def now = Time.now
end

class FakeClock
  attr_accessor :now
  def initialize(start = Time.at(0))
    @now = start
  end
end

class Service
  def initialize(clock = RealClock.new)
    @clock = clock
  end
end
```

**Testing**: RSpec `double`, `instance_double` for verified fakes, `allow(clock).to receive(:now).and_return(...)`.

---

### PHP

**Seam as interface + constructor injection**:
```php
interface Clock {
    public function now(): DateTimeImmutable;
}

class RealClock implements Clock {
    public function now(): DateTimeImmutable { return new DateTimeImmutable(); }
}

class FakeClock implements Clock {
    private DateTimeImmutable $time;
    public function now(): DateTimeImmutable { return $this->time; }
}

class Service {
    public function __construct(private Clock $clock) {}
}
```

---

### PowerShell

**Seam as parameterized function or script-scoped mock**:
```powershell
function New-Service {
    param([ScriptBlock] $Clock = { Get-Date })
    return @{ Clock = $Clock }
}
```
Pester mocking (`Mock Get-Date`) for external commands. Prefer DI over mocking where feasible.

---

### Bash

**Seam as function parameter or environment variable override**:
```bash
_service_do_thing() {
    local clock_fn="${1:-date +%s}"
    local now
    now=$($clock_fn)
}
# Test: _service_do_thing 'echo 1000'
```

---

## Cross-Language Seam Testing

When a seam crosses a language boundary (FFI), test it at both ends:

1. **Unit-test the callee in its native language** (e.g., Rust `#[test]` for the Rust library).
2. **Unit-test the caller with a language-native fake of the callee** (e.g., Python `FakeDatabase` that mimics the Rust library's C types).
3. **Integration-test the full FFI stack** (e.g., Python test that loads the real Rust cdylib and exercises the actual ctypes calls).

Never trust a seam that's only tested on one side of the language boundary.

## Fake-as-Contract Verification

For every fake used in tests, verify it satisfies the same contract as the real implementation:

1. The fake returns the same type as the real implementation. No `unwrap()` needed only for the fake.
2. The fake's error behaviour matches the real implementation's documented error modes. If the real impl returns `Error::Timeout` after 5s, the fake should be configurable to return `Error::Timeout` on demand.
3. The fake does not silently succeed where the real impl would fail. A fake database that accepts any query and returns `[]` is training callers to expect a database that never errors.

**Contract test pattern** (shared across real and fake):
```rust
// A test that runs against any Clock impl
fn clock_must_be_monotonic(clock: &impl Clock) {
    let t1 = clock.now();
    // (can't enforce this in a single-threaded test, but the framework exists)
}
// Run against RealClock in CI, FakeClock in unit tests
```

## Review Rules

- **BLOCKER**: a seam has only one implementation, no test uses a fake, and no second implementation is concretely planned.
- **WARNING**: a test uses `patch`/`mock`/`jest.mock` where a DI seam would work and the module is under the team's control.
- **WARNING**: a fake violates the real implementation's documented contract (different return type, swallows errors, has different lifecycle).
- **INFO**: a seam exists but no contract test validates that fakes and real implementations behave consistently.
