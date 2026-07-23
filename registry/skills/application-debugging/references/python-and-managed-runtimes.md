# Python And Managed Runtime Debugging

Use this reference for Python first, then for selecting evidence in JVM, .NET, Go, Ruby, or PHP application failures. Read only the relevant runtime section.

## Python

Preserve the project's declared Python version and environment workflow. In this repository, prefer `uv`; in another project, follow its existing toolchain.

Start with a focused failure:

```bash
uv run pytest -x path/to/test_file.py::test_name
uv run python -m pdb path/to/script.py
PYTHONFAULTHANDLER=1 uv run python path/to/script.py
```

Use `breakpoint()` or `pdb` for control-flow and state inspection, `faulthandler` for hangs and fatal signals, `tracemalloc` for Python allocation traces, and a sampling profiler such as `py-spy` when low observer impact matters. Confirm third-party tools are already approved before installing them.

Key distinctions:

- Read the full chained traceback (`__cause__` and `__context__`), not only the final exception.
- A Python heap profile does not account for every native extension allocation.
- For `asyncio`, capture task stacks, cancellation state, event-loop ownership, and blocking synchronous calls.
- For multiprocessing, record start method, child environment, serialization boundary, exit code, signal, and captured stderr.
- For native crashes in CPython or an extension, switch to `native-binary-debugging` while retaining the Python-level reproduction.

## JVM

Use a focused test or request replay plus the runtime's own evidence:

- Thread dump for deadlock, blocked threads, and executor starvation.
- JFR or an approved profiler for CPU, allocation, locks, and latency.
- Heap dump and dominator/retained-size analysis for memory growth.
- GC logs and pause evidence before attributing latency to garbage collection.
- Exception and causal chains with the exact classpath, JVM, framework, and deployment artifact identity.

Use `jcmd`, `jstack`, JFR, and debugger commands only after checking the installed JDK's help because command availability and output differ by JDK version.

## .NET

Choose among debugger breakpoints, `dotnet-counters`, `dotnet-trace`, `dotnet-dump`, and SOS based on the symptom. Match the dump, runtime, DAC/SOS, binaries, and PDBs before trusting managed frames or locals. A dump collected without required heap pages cannot answer every memory question.

For async hangs, inspect task state, thread-pool starvation, synchronization context, locks, and downstream waits. For memory growth, distinguish managed heap retention, native allocations, pinned objects, loader heaps, and OS cache.

## Go

Use a focused `go test`, Delve, goroutine dump, `pprof`, runtime trace, or the race detector as appropriate. Preserve the module's declared Go version and build flags. Treat a race-detector-only result as strong evidence of a race but not necessarily the original production schedule; reproduce the user symptom separately.

For hangs, capture all goroutine stacks and identify wait reasons, channel ownership, lock order, context cancellation, and shutdown paths. For CPU or heap claims, use representative `pprof` profiles rather than intuition.

## Ruby and PHP

Use the project's debugger and profiler stack rather than adding a new one by default. For Ruby, inspect full exception causes, thread/fiber state, object retention, and blocking native calls. For PHP, distinguish request lifecycle, FPM worker state, opcode/cache behavior, framework middleware, database waits, and Xdebug overhead.

## Cross-runtime checks

- Confirm the runtime and artifact actually executing, not only the source checkout.
- Capture environment, locale, timezone, encoding, feature flags, dependency resolution, and process launch arguments.
- Prefer a thread/task dump for hangs and a profiler for performance; broad debug logging can hide races and amplify latency.
- Switch to `native-binary-debugging` when the decisive evidence becomes a native crash, core/minidump, machine address, native heap corruption, or ABI boundary.

Official references:

- Python `pdb`: `https://docs.python.org/3/library/pdb.html`
- Python `faulthandler`: `https://docs.python.org/3/library/faulthandler.html`
- Python `tracemalloc`: `https://docs.python.org/3/library/tracemalloc.html`
- Go diagnostics: `https://go.dev/doc/diagnostics`
- .NET diagnostics: `https://learn.microsoft.com/dotnet/core/diagnostics/`
