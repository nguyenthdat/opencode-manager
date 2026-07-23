# embed-preserve-target-version

> Preserve the target runtime's actual Lua version/dialect — always verify it

## Why It Matters

Lua varies more across deployment targets than almost any other language: Neovim embeds LuaJIT (5.1 semantics plus extensions) by default on most platforms but can be built against PUC-Lua 5.1; OpenResty embeds LuaJIT; Redis embeds Lua 5.1 (historically) via a modified interpreter; many game engines bundle LuaJIT 2.1 for its FFI and JIT speed; some newer projects deliberately choose vanilla Lua 5.4 for `<const>`/`<close>`/integer division. Writing 5.4-only syntax (`<const>`, `<close>`, native integer division `//` used implicitly with newly-added behaviors) into a script destined for a LuaJIT or Redis-embedded 5.1 target simply fails to load.

## Bad

```lua
-- Written without checking the target -- silently assumes Lua 5.4 features
-- are available everywhere
local function process(items)
  local total <const> = 0   -- fine on Lua 5.4, a SYNTAX ERROR on 5.1/5.2/5.3/LuaJIT
  for _, item <close> in ipairs(items) do  -- also invalid outside 5.4
    ...
  end
end
```

## Good

```lua
-- Always identify the actual runtime first
print(_VERSION)                       -- "Lua 5.1" / "Lua 5.4" / etc.
print(jit and jit.version or "not LuaJIT")  -- LuaJIT exposes a global `jit` table

-- Write to the lowest common denominator the target actually requires.
-- Targeting Redis (Lua 5.1-based scripting) or LuaJIT: avoid 5.4-only syntax
local function process(items)
  local total = 0
  for _, item in ipairs(items) do
    total = total + item.value
  end
  return total
end

-- Only use 5.4 attributes when you've verified the target is vanilla 5.4:
-- local total <const> = compute_total(items)  -- fine ONLY on confirmed Lua 5.4
```

## A Quick Compatibility Checklist

Before writing anything version-specific, confirm: (1) which `_VERSION` the host reports, (2) whether `jit` is defined (LuaJIT), (3) whether the host restricts the standard library (sandboxed `os`/`io`, as in Redis scripts), (4) whether integer subtype (5.3+) or bitwise operators (5.3+) are available.

## See Also

- [embed-luajit-vs-plain](embed-luajit-vs-plain.md)
- [scope-const-attribute](scope-const-attribute.md)
- [scope-close-attribute](scope-close-attribute.md)
