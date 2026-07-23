# embed-luajit-vs-plain

> Know LuaJIT's 5.1-plus-extensions dialect and where it diverges from PUC-Lua

## Why It Matters

LuaJIT remains extremely widely deployed (Neovim, OpenResty, many game engines) despite implementing the Lua 5.1 language core rather than 5.2/5.3/5.4 — it adds its own extensions (`ffi`, `table.new`, `bit` module for bitwise ops, goto/labels backported from 5.2, some 5.2 semantics) on top of a 5.1 base, making it neither strictly "5.1" nor compatible with later PUC-Lua releases. Code written assuming either pure 5.1 or pure 5.4 semantics can silently misbehave on LuaJIT.

## Bad

```lua
-- Assuming 5.3+ native bitwise operators work on LuaJIT -- they don't;
-- LuaJIT uses its own `bit` library instead, since it predates 5.3
local flags = a & b   -- syntax error on LuaJIT (and on Lua 5.1/5.2 too)

-- Assuming table.pack/table.unpack exist because "LuaJIT is modern" --
-- LuaJIT's stdlib is 5.1-based, so these 5.2+ additions aren't there either
local packed = table.pack(...)  -- table.pack is nil on LuaJIT
```

## Good

```lua
-- Bitwise ops on LuaJIT: use the bit library it actually provides
local bit = require("bit")
local flags = bit.band(a, b)

-- Portable varargs packing across LuaJIT and all PUC-Lua versions
local function pack_compat(...)
  return { n = select("#", ...), ... }
end
local packed = table.pack and table.pack(...) or pack_compat(...)

-- Feature-detect rather than assume, when code must run on both:
local has_ffi = pcall(require, "ffi")
local has_bitops_native = (pcall(load, "return 1 & 1"))  -- true only on 5.3+/5.4

if has_ffi then
  -- take the LuaJIT-optimized path (ffi structs, table.new, etc.)
else
  -- fall back to a portable, PUC-Lua-compatible implementation
end
```

## Key LuaJIT Divergences to Remember

No `<const>`/`<close>` (5.4-only), no native `//`/`&`/`|` bitwise operators (use the `bit` library instead), has `ffi` and `table.new` (PUC-Lua has neither), `goto`/labels are supported (backported from 5.2), and `_VERSION` still reports `"Lua 5.1"` even though `jit.version` reports the actual LuaJIT version.

## See Also

- [embed-preserve-target-version](embed-preserve-target-version.md)
- [perf-luajit-ffi](perf-luajit-ffi.md)
- [perf-luajit-table-new](perf-luajit-table-new.md)
