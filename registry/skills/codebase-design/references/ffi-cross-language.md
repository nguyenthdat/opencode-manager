# FFI Cross-Language Module Design

When a codebase spans multiple languages, the language boundary is a module interface. Design it with the same rigour as any other module boundary. This reference covers the design patterns, contracts, and pitfalls for every common language pair.

## The C ABI is the Contract

Every FFI call ultimately crosses through a C-compatible ABI. Even when using language-specific FFI tools (PyO3 for Rust↔Python, Neon for Rust↔Node, cgo for Go↔C), the wire format is C-ABI-compatible: fixed-size types, C calling convention, no name mangling, no exceptions unwinding across the boundary.

**Universal FFI contract elements** (decide for every boundary):

1. **Memory ownership**: which language allocates, which deallocates, and whether ownership transfers across the call.
2. **Lifetime**: how long the caller's memory reference is valid — does the callee copy it or borrow it?
3. **Error model**: how errors cross the boundary. C return codes + thread-local errors, or out-parameters.
4. **Thread safety**: can the callee be called from multiple threads? If so, who synchronizes?
5. **Null handling**: can any parameter be null? If so, what does null mean (default, error, skip)?

---

## Rust → C (Exposing Rust to C)

**Tooling**: `extern "C"` functions, `#[no_mangle]`, `cbindgen` for header generation.

**Contract**:
- Allocator: Rust allocates with the global allocator. C can allocate but must use Rust-provided `free` functions.
- Lifetime: explicit borrow or ownership transfer. Never expose a raw borrow without a documented lifetime.

**Pattern**:
```rust
// lib.rs — Rust library exposing C ABI
#[no_mangle]
pub extern "C" fn db_open(path: *const c_char) -> *mut Database {
    // convert C string to Rust, allocate, return opaque pointer
}

#[no_mangle]
pub unsafe extern "C" fn db_close(db: *mut Database) {
    // Box::from_raw to reclaim ownership and drop
}

#[no_mangle]
pub unsafe extern "C" fn db_query(
    db: *const Database,
    query: *const c_char,
    result: *mut *mut c_char,  // out-parameter: caller frees with db_free_string
    error: *mut *mut c_char,   // out-parameter: caller frees with db_free_string
) -> i32 {  // 0 = success, non-zero = error code
    // catch_unwind to prevent panics crossing the boundary
}
```

**Pitfalls**:
- Never let a Rust panic unwind through `extern "C"`. Wrap every public function body in `std::panic::catch_unwind`.
- `&T` and `&mut T` are UB if the C code mutates from another thread. Prefer `*const T`/`*mut T` in FFI signatures.
- `#[repr(C)]` on every struct that crosses the boundary.
- `bool` is not C-compatible — use `u8` or an explicit enum.
- Do not expose `Vec<T>`, `String`, `HashMap`, or any non-`#[repr(C)]` type.

---

## Rust → Python (via PyO3)

**Tooling**: PyO3, `maturin` for build+package.

**Contract**:
- Memory: PyO3 handles the Python↔Rust translation. Rust types that implement `IntoPy`/`FromPyObject` are auto-converted.
- Errors: Rust `Result<T, E>` where `E: PyErr` is auto-converted to a Python exception.
- GIL: Rust code must not hold the GIL across a long-running operation. Use `Python::allow_threads`.

**Pattern**:
```rust
use pyo3::prelude::*;

#[pyclass]
struct Database { /* internal state */ }

#[pymethods]
impl Database {
    #[new]
    fn new(path: &str) -> PyResult<Self> { /* ... */ }

    fn query(&self, sql: &str) -> PyResult<Vec<Vec<String>>> {
        // GIL released during I/O-bound work
    }
}

#[pymodule]
fn mylib(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_class::<Database>()?;
    Ok(())
}
```

**Pitfalls**:
- The GIL serializes Python threads. CPU-bound Rust work should release the GIL.
- Python objects (`Py<PyAny>`) hold a reference count. Dropping them from a non-GIL thread is UB.
- PyO3 classes must be `Send` if exposed to Python threads.

---

## Rust → Node.js (via napi-rs)

**Tooling**: napi-rs, `@napi-rs/cli`.

**Contract**: similar to PyO3. N-API handles JS↔Rust value conversion. Async operations use `AsyncTask` or `#[napi(ts_return_type = "Promise<T>")]`.

**Pattern**:
```rust
use napi_derive::napi;

#[napi]
pub fn query(db_path: String, sql: String) -> napi::Result<Vec<Vec<String>>> {
    // errors auto-converted to JS exceptions
}
```

**Pitfalls**:
- N-API values are tied to the JS event loop. Do not hold JS references across async boundaries without `Ref`.
- `Buffer`/`Uint8Array` lifetime: copy or pin, do not borrow.
- Thread safety: `#[napi]` functions may be called from any thread. Use `Send + Sync` types.

---

## Go → C (cgo)

**Tooling**: cgo (`import "C"`), C preamble in comments.

**Contract**:
- Memory: Go's GC does not manage C allocations. Use `C.malloc`/`C.free` for C memory. For Go memory passed to C, pin or copy — the GC may move it.
- Goroutines: C calls block the goroutine's OS thread. Run in a dedicated OS thread or limit concurrency.

**Pattern**:
```go
/*
#include <stdlib.h>
*/
import "C"
import "unsafe"

func Query(path, sql string) ([]byte, error) {
    cPath := C.CString(path)
    defer C.free(unsafe.Pointer(cPath))

    cSql := C.CString(sql)
    defer C.free(unsafe.Pointer(cSql))

    // Call C function...
    // Convert C result to Go, free C result
}
```

**Pitfalls**:
- `C.CString` allocates with `malloc` — must be freed.
- Go pointers passed to C are valid only for the duration of the call. The GC cannot trace them.
- `cgo` has per-call overhead. Batch FFI calls or move the boundary higher.
- Never pass a Go pointer to C and store it for later use (the GC may move it). Use `C.malloc` for C-owned memory.

---

## Python → C (ctypes / cffi)

**Tooling**: `ctypes` (stdlib) or `cffi` (more ergonomic).

**Contract**:
- Memory: Python owns Python objects. C owns C allocations. Convert at the boundary.
- Errors: set `errno` or return error codes. Python calls `ctypes.get_errno()` / `ctypes.get_last_error()`.
- Threads: C functions must be thread-safe if called from multiple Python threads.

**Pattern (ctypes)**:
```python
import ctypes

lib = ctypes.CDLL("./libdb.so")
lib.db_open.argtypes = [ctypes.c_char_p]
lib.db_open.restype = ctypes.c_void_p  # opaque pointer
lib.db_close.argtypes = [ctypes.c_void_p]
lib.db_free_string.argtypes = [ctypes.c_void_p]

class Database:
    def __init__(self, path: str):
        self._ptr = lib.db_open(path.encode())
    def __del__(self):
        lib.db_close(self._ptr)
```

**Pitfalls**:
- Default argument types are `c_int`. Always set `argtypes` and `restype`.
- Python strings are UTF-8; C may expect null-terminated ASCII. Encode explicitly.
- `ctypes` callbacks must keep a Python reference alive, or the GC will collect them while C holds the function pointer.

---

## Python → Rust (via ctypes/cffi + cdylib)

**Tooling**: Rust `cdylib` crate type, Python `ctypes`/`cffi`.

**Contract**: same as Rust→C, consumed from Python.

**Pattern**:
```toml
# Cargo.toml
[lib]
crate-type = ["cdylib"]
```
```python
import ctypes
lib = ctypes.CDLL("./target/release/libdb.so")
# ... same ctypes pattern as Python→C
```

---

## C++ → Rust / Rust → C++

**Tooling**: `extern "C"` on both sides. C++20 modules do not help here — the boundary must be C ABI.

**Pitfalls**:
- C++ exceptions must never unwind through C frames. Catch at the C++ side of every boundary.
- C++ class layout is not stable across compilers. Never expose a C++ class across the boundary.
- Use `std::unique_ptr` with a custom deleter that calls the foreign language's `free` function.
- `std::string`, `std::vector`, and other STL types are not FFI-safe. Convert to `const char*` + length, `T*` + count.

---

## C# → C (P/Invoke)

**Tooling**: `[DllImport]` attribute, `System.Runtime.InteropServices`.

**Contract**:
- Memory: .NET marshals by default. For manual memory, use `IntPtr` and `Marshal.AllocHGlobal`/`FreeHGlobal`.
- Errors: `SetLastError = true` in `[DllImport]` to capture `errno`. Or return error codes.

**Pattern**:
```csharp
[DllImport("libdb", CallingConvention = CallingConvention.Cdecl)]
static extern IntPtr db_open(string path);

[DllImport("libdb", CallingConvention = CallingConvention.Cdecl)]
static extern int db_close(IntPtr db);
```

**Pitfalls**:
- Default calling convention is `StdCall` on Windows. Always specify `Cdecl` for cross-platform.
- String marshaling is expensive and involves copying. Use `byte[]` or `IntPtr` for large data.
- P/Invoke is synchronous unless wrapped in `Task.Run`.
- `SafeHandle` is preferred over raw `IntPtr` for resource cleanup.

---

## C# → Rust (via cdylib + P/Invoke)

Same contract as C#→C. Use `#[no_mangle] pub extern "C"` on the Rust side, `[DllImport]` on the C# side.

---

## Swift → Rust (via C bridge)

**Tooling**: Rust `cdylib` → C header → Swift module map or bridging header.

**Contract**:
- Swift imports C headers natively. Opaque C pointers become `OpaquePointer` in Swift.
- Wrap the opaque pointer in a Swift class with `deinit` calling the free function (ARC-compatible).
- Swift `Data`/`[UInt8]` ↔ C `const uint8_t*` + length. Copy or use `withUnsafeBytes`.

**Pattern**:
```swift
// Bridging header: #include "libdb.h"

class Database {
    private let ptr: OpaquePointer

    init(path: String) {
        self.ptr = db_open(path)
    }

    deinit {
        db_close(ptr)
    }

    func query(_ sql: String) throws -> String {
        // call C, translate errors to Swift throws
    }
}
```

**Pitfalls**:
- Swift `String` ↔ C `const char*` requires explicit conversion (`String(cString:)`, `.withCString`).
- Swift ARC ref-counts the class wrapper; the `deinit` must release the foreign resource.
- Never store the opaque pointer in a `struct` that gets copied — use `class` (reference semantics).

---

## Kotlin/Java → C (JNI)

**Tooling**: `System.loadLibrary`, `native` keyword, `javah`/`javac -h` for header generation.

**Contract**:
- JNI functions have specific naming: `Java_<package>_<Class>_<method>`.
- Memory: JNI local references are valid only for the duration of the native call. Use `NewGlobalRef`/`DeleteGlobalRef` for persistent references.
- Errors: `(env)->ThrowNew(env, exceptionClass, message)` to throw Java exceptions from native code.

**Pitfalls**:
- JNI is verbose and error-prone. For Kotlin, prefer Rust via UniFFI or a C-bridge library over raw JNI.
- Local references are limited (~512 per call). `PushLocalFrame`/`PopLocalFrame` for loops.
- The JVM may move objects; pin arrays with `GetPrimitiveArrayCritical`/`ReleasePrimitiveArrayCritical`.

---

## Node.js → C (n-api/node-addon-api)

**Tooling**: `napi.h` (C API), `node-addon-api` (C++ wrapper), `napi-rs` (Rust).

**Contract**: N-API is the stable ABI. Use it over raw V8 APIs for forward compatibility.

**Pitfalls**:
- N-API calls are synchronous by default. Use `napi_create_async_work` for async operations.
- JavaScript values (`napi_value`) are valid only for the duration of the native call.
- Thread safety: N-API functions can only be called from the main JS thread or an async worker thread, not arbitrary threads.

---

## Lua → C (Lua C API)

**Tooling**: `lua_State*`, stack-based API.

**Contract**:
- Lua stack: arguments are pushed (caller → C) or popped (C → caller). Stack discipline is critical — a mismatched stack corrupts the interpreter.
- Memory: Lua's GC manages Lua-owned objects. C allocations are the C code's responsibility.
- Errors: `lua_error(L)` / `luaL_error(L, ...)` to raise Lua errors. `lua_pcall` for protected calls.

**Pitfalls**:
- Stack index discipline is hard to debug. Use `luaL_check*` for argument validation.
- Never hold a `lua_State*` or Lua reference across a yield (coroutine).

---

## Multi-Language Build Coordination

In a repo with modules in N languages, the build system must orchestrate the dependency order.

### Dependency matrix

| Caller → Callee | Rust | C | C++ | Python | Go | C# | JS/TS | Java/Kotlin | Swift |
|---|---|---|---|---|---|---|---|---|---|
| **Rust** | cargo | cdylib | cdylib | PyO3/maturin | cdylib | cdylib | napi-rs | cdylib+JNI | cdylib |
| **C** | N/A | linking | linking | ctypes | cgo | P/Invoke | N-API | JNI | bridging |
| **C++** | extern C | linking | linking | ctypes | cgo | P/Invoke | N-API | JNI | bridging |
| **Python** | ctypes | ctypes | ctypes | N/A | subprocess | subprocess | subprocess | subprocess | subprocess |
| **Go** | cgo | cgo | cgo | cgo | N/A | cgo | N-API | cgo | cgo |
| **C#** | P/Invoke | P/Invoke | P/Invoke | P/Invoke | P/Invoke | N/A | P/Invoke | P/Invoke | P/Invoke |
| **JS/TS** | N-API | N-API | N-API | child_process | N-API | N-API | N/A | N-API | N-API |
| **Java/Kt** | JNI | JNI | JNI | JNI | JNI | JNI | JNI | N/A | JNI |
| **Swift** | C bridge | C bridge | C bridge | C bridge | C bridge | C bridge | C bridge | C bridge | N/A |

### Build ordering

1. C libraries build first (they have no FFI dependencies).
2. Rust cdylib crates build next (they may call C).
3. Language-specific wrappers build next (Python wheels, Go cgo packages, N-API addons, JNI libs, Swift modules).
4. Pure-language modules build last (they import the FFI wrappers).

Record the build DAG in the architecture artifact. Example:

```text
libdb_c (C) → libdb_rs (Rust cdylib, calls libdb_c) → pydb (Python wheel, wraps libdb_rs)
                                                    → godb (Go cgo, wraps libdb_rs)
                                                    → nodedb (N-API, wraps libdb_rs)
```

### Cross-language test strategy

- Unit-test each language's module through its native test runner.
- Integration-test across languages with a shared test harness. The test harness is written in the highest-level language (Python, JS, or a shell script) and exercises the full FFI stack.
- Memory leak tests: run the FFI integration tests under Valgrind (for C/C++/Rust), LeakSanitizer, or the language's memory profiler.
- Thread-safety tests: run under ThreadSanitizer (TSan) for C/C++/Rust/Go native code.

---

## FFI Decision Record

For every FFI seam, record:

```text
Language pair: <caller language> → <callee language>
Binding mechanism: <ctypes | cffi | PyO3 | cgo | P/Invoke | JNI | N-API | C bridge>
Data types crossing: <which types go across; how they map>
Memory ownership: <who allocates, who frees, lifetime>
Error translation: <how errors cross: exception↔return code↔thread-local error>
Thread safety: <can it be called concurrently; if so, how is sync guaranteed>
Null policy: <which parameters accept null; what null means>
Build dependency: <which component must build first>
```
