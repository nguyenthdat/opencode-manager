# doc-examples-in-comments

> Include a runnable usage example in doc comments for non-obvious functions

## Why It Matters

A parameter list and return-type annotation tell you *what* a function accepts and returns, but not always *how* it's meant to be used in practice — especially for functions with several optional parameters, a callback-based API, or non-obvious ordering requirements. A short example in the doc comment answers "how do I actually call this?" without needing to search for a real call site elsewhere in the codebase.

## Bad

```lua
---@param pattern string
---@param opts table?
---@return fun(): string?
local function tokenizer(pattern, opts) ... end
-- No indication of how `opts` is shaped or how to actually iterate the result
```

## Good

```lua
---Creates a tokenizer that yields matches of `pattern` one at a time.
---@param pattern string A Lua pattern to match tokens against
---@param opts { trim: boolean? } Options; `trim` strips whitespace from each token
---@return fun(): string? next_token Call repeatedly until it returns nil
---
---@usage
--- local next_token = tokenizer("%a+", { trim = true })
--- for token in next_token do
---   print(token)
--- end
local function tokenizer(pattern, opts) ... end
```

## Keep Examples Real and Runnable

An example that would actually error if pasted into a REPL is worse than no example — verify it against the real function signature, ideally by copying it directly out of a passing test.

## See Also

- [doc-emmylua-annotations](doc-emmylua-annotations.md)
- [doc-ldoc-comments](doc-ldoc-comments.md)
- [doc-readme-usage](doc-readme-usage.md)
