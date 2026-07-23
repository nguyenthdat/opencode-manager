# doc-module-header

> Document the module's purpose in a header comment block

## Why It Matters

A new reader opening any Lua file has no equivalent of a package/namespace declaration to orient them — the first few lines of the file are the only reliable place to state what the module does, what it depends on, and any important usage notes, before diving into the code itself.

## Bad

```lua
local M = {}

function M.connect(host, port) ... end
function M.send(data) ... end
function M.close() ... end

return M
```

## Good

```lua
--- TCP connection pool manager.
--
-- Maintains a small pool of reusable TCP connections to reduce the cost of
-- repeated connect/disconnect cycles for short-lived requests. Not safe to
-- share a single pool instance across OS threads; safe to share across
-- coroutines within one Lua state.
--
-- @module connection_pool
-- @author Platform Team
-- @license MIT

local M = {}

function M.connect(host, port) ... end
function M.send(data) ... end
function M.close() ... end

return M
```

## Keep It Proportional

A five-line utility module doesn't need a paragraph of prose — one line stating its purpose is enough. Reserve a fuller header (dependencies, thread-safety notes, usage example) for modules with real behavioral subtleties that aren't obvious from the function signatures alone.

## See Also

- [doc-ldoc-comments](doc-ldoc-comments.md)
- [doc-readme-usage](doc-readme-usage.md)
- [scope-module-pattern](scope-module-pattern.md)
