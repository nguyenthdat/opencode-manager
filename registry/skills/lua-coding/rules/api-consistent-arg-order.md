# api-consistent-arg-order

> Keep a consistent argument order: subject first, options/callback last

## Why It Matters

Lua's standard library and most well-known frameworks (LÖVE, OpenResty, Neovim's Lua API) follow "subject, then modifiers, then callback" as their default parameter order. Deviating from that within your own codebase — sometimes subject-first, sometimes subject-last — forces callers to double-check every call site instead of relying on muscle memory.

## Bad

```lua
-- Inconsistent ordering across a module's own functions
local M = {}
function M.save(callback, path, data) ... end       -- callback FIRST here
function M.load(path, callback) ... end             -- callback LAST here
function M.delete(callback, path) ... end           -- callback first again, different position than save
```

## Good

```lua
local M = {}

-- Consistent convention: subject(s) first, options/callback last, always
function M.save(path, data, callback) ... end
function M.load(path, callback) ... end
function M.delete(path, callback) ... end

-- Mirrors the standard library's own convention, e.g.:
-- string.format(fmt, ...)        -- format string (subject) first
-- table.insert(t, [pos,] value)  -- table (subject) first
-- pcall(f, ...)                  -- function (subject) first, args after
```

## Self as the Implicit First Argument

For methods (colon syntax), `self` is always first and implicit — don't also add an explicit "target" parameter that duplicates it:

```lua
-- Good: self is naturally first via colon syntax, no redundant target param
function Connection:send(message, opts) ... end
conn:send("hello", { retries = 3 })
```

## See Also

- [api-options-table](api-options-table.md)
- [fn-callback-signature](fn-callback-signature.md)
- [name-self-convention](name-self-convention.md)
