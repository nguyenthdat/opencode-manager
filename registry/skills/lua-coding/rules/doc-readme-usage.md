# doc-readme-usage

> Provide a README with installation and usage instructions

## Why It Matters

A README is the first (and often only) thing a potential user or contributor reads before deciding whether to adopt a module — without install instructions and a minimal usage example, even a well-written library goes unused simply because nobody could figure out how to get started in under a minute.

## Bad

```markdown
# mylib

A Lua library.
```

## Good

```markdown
# mylib

A small library for validating and formatting phone numbers.

## Installation

Via LuaRocks:

    luarocks install mylib

Or vendor `mylib.lua` directly into your project.

## Usage

```lua
local mylib = require("mylib")

local ok = mylib.is_valid("+1-555-0100")
local formatted = mylib.format("15550100", "US")
-- formatted == "+1 (555) 010-0"
```

## Supported Lua Versions

Lua 5.1, 5.2, 5.3, 5.4, and LuaJIT 2.0+.

## License

MIT
```

## What to Always Include

Installation method(s), a minimal runnable usage snippet (copy-pasteable, not pseudocode), which Lua versions/dialects are supported (see `embed-preserve-target-version`), and the license.

## See Also

- [doc-module-header](doc-module-header.md)
- [doc-changelog](doc-changelog.md)
- [proj-rockspec-luarocks](proj-rockspec-luarocks.md)
