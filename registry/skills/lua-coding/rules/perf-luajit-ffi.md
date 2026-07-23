# perf-luajit-ffi

> Use LuaJIT's FFI for hot numeric/C-interop paths

## Why It Matters

LuaJIT's `ffi` library lets Lua code call C functions and manipulate C-layout structs directly, without writing a C binding module — the JIT compiler can inline and specialize FFI numeric code aggressively, often approaching native C performance for tight numeric loops (vector math, image processing, binary parsing). This is a LuaJIT-only extension; vanilla PUC-Lua has no `ffi` library at all.

## Bad

```lua
-- Pure-Lua struct emulation via a table: extra indirection, boxing overhead,
-- and no direct interop if you need to call an existing C library
local function make_vec3(x, y, z)
  return { x = x, y = y, z = z }
end

local function vec3_add(a, b)
  return make_vec3(a.x + b.x, a.y + b.y, a.z + b.z)  -- allocates a table each call
end
```

## Good

```lua
-- LuaJIT only: ffi.cdef defines a real C struct layout, ffi.new allocates
-- it without going through Lua's table/GC machinery for the fields
local ffi = require("ffi")

ffi.cdef[[
  typedef struct { double x, y, z; } Vec3;
]]

local Vec3 = ffi.typeof("Vec3")

local function vec3_add(a, b)
  return Vec3(a.x + b.x, a.y + b.y, a.z + b.z)
end

local a = Vec3(1, 2, 3)
local b = Vec3(4, 5, 6)
local c = vec3_add(a, b)
print(c.x, c.y, c.z)  -- 5  7  9

-- Calling an existing C library directly, no binding module needed
ffi.cdef[[
  int printf(const char *fmt, ...);
]]
ffi.C.printf("value: %d\n", 42)
```

## Version Note

`ffi` is LuaJIT-specific. Code using it will not run on vanilla PUC-Lua 5.1-5.4 at all — gate FFI usage behind a `pcall(require, "ffi")` check or a build-time flag if the same codebase must also run on non-LuaJIT targets.

## See Also

- [embed-luajit-vs-plain](embed-luajit-vs-plain.md)
- [perf-luajit-table-new](perf-luajit-table-new.md)
- [anti-ffi-unsafe-defaults](anti-ffi-unsafe-defaults.md)
