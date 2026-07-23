# lint-type-check-lua-ls

> Use `lua-language-server` diagnostics for editor-integrated type checking

## Why It Matters

`lua-language-server` (the modern successor to the "sumneko" language server) reads the EmmyLua/LuaCATS annotations (`---@param`, `---@class`) directly from your source and provides live type-checking diagnostics in the editor — catching type mismatches, missing required fields, and undefined-field typos before you ever run the code, without needing a separate build step.

## Bad

```lua
-- No annotations at all: lua-language-server has nothing to check against,
-- so a type mismatch or typo isn't caught until runtime
local function set_volume(level)
  audio.volume = level
end

set_volume("loud")  -- no warning shown anywhere in the editor
```

## Good

```lua
---@param level number Volume level between 0.0 and 1.0
local function set_volume(level)
  audio.volume = level
end

-- set_volume("loud")  -- lua-language-server flags this inline:
--   "Cannot assign `string` to parameter `number`."
```

```jsonc
// .luarc.json -- project-level lua-language-server configuration
{
  "runtime.version": "LuaJIT",     // match the actual target runtime!
  "diagnostics.globals": ["vim"],   // Neovim plugin project, for example
  "workspace.checkThirdParty": false
}
```

## Setting `runtime.version` Correctly

Always set `runtime.version` (or the equivalent setting for your editor's LSP config) to match the *actual* deployment target (`"Lua 5.1"`, `"LuaJIT"`, `"Lua 5.4"`) — otherwise the language server may flag valid version-specific syntax as an error, or fail to flag genuinely invalid syntax for your target.

## See Also

- [doc-emmylua-annotations](doc-emmylua-annotations.md)
- [doc-class-annotations](doc-class-annotations.md)
- [embed-preserve-target-version](embed-preserve-target-version.md)
