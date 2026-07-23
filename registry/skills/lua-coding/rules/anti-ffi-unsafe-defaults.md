# anti-ffi-unsafe-defaults

> Anti-pattern: using LuaJIT FFI without validating pointer/lifetime assumptions

## Why It Matters

LuaJIT's `ffi` library gives Lua code direct, unchecked access to raw memory — unlike ordinary Lua tables/values, an `ffi.cdef`'d struct or pointer has none of Lua's usual safety net (no bounds checking, no automatic lifetime tracking beyond what `ffi.gc` you set up yourself). Treating FFI values as casually as ordinary Lua values is a direct path to memory corruption, use-after-free, and crashes that Lua code otherwise never has to worry about.

## Bad

```lua
local ffi = require("ffi")
ffi.cdef[[ void *malloc(size_t size); void free(void *ptr); ]]

local function make_buffer(n)
  local ptr = ffi.C.malloc(n)
  return ptr   -- no lifetime management at all -- caller must remember to
                -- free it manually, and Lua's GC has no idea this exists
end

local buf = make_buffer(1024)
-- ... buf is used ...
-- if free(buf) is ever forgotten, this leaks; if it's called twice,
-- that's a double-free -- undefined behavior, possibly a crash
```

## Good

```lua
local ffi = require("ffi")
ffi.cdef[[ void *malloc(size_t size); void free(void *ptr); ]]

local function make_buffer(n)
  local ptr = ffi.C.malloc(n)
  if ptr == nil then
    error("malloc failed")
  end
  -- ffi.gc attaches a finalizer: Lua's GC will call free() automatically
  -- once nothing references `ptr` anymore -- ties memory lifetime to Lua's
  -- own garbage collector, closing the manual-management gap
  return ffi.gc(ptr, ffi.C.free)
end

local buf = make_buffer(1024)
-- buf is automatically freed when it becomes unreachable; no manual
-- free() call needed, and no risk of a double-free from calling it twice
```

## Always Validate Pointers Returned From C

Never assume a C function that can fail (`malloc`, file/socket opens) succeeded — check for `nil`/`NULL` explicitly before dereferencing, exactly as you would in C itself; Lua's usual "just index it and get a clean error" safety net does not extend to raw FFI pointers.

## See Also

- [perf-luajit-ffi](perf-luajit-ffi.md)
- [embed-luajit-vs-plain](embed-luajit-vs-plain.md)
- [err-validate-args](err-validate-args.md)
