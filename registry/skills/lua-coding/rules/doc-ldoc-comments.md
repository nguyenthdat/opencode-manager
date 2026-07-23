# doc-ldoc-comments

> Use LDoc-style doc comments for generated HTML/text documentation

## Why It Matters

`LDoc` (the Lua ecosystem's most established documentation generator, successor to LuaDoc) parses specially formatted comment blocks to produce browsable API reference documentation — useful for libraries published to LuaRocks where consumers expect generated docs rather than reading source directly. It predates and is complementary to the newer EmmyLua/LuaCATS annotations used for editor tooling.

## Bad

```lua
-- gets a user from the database, returns nil if not found
local function get_user(id) ... end
```

## Good

```lua
--- Fetches a user record from the database.
-- @function get_user
-- @tparam number id The user's unique identifier
-- @treturn table|nil The user record, or nil if not found
-- @treturn string|nil An error message if the lookup failed
-- @usage
--   local user, err = get_user(42)
--   if not user then print(err) end
local function get_user(id) ... end
```

```lua
--- User management module.
-- @module userservice
local M = {}
```

## Generating Docs

```sh
ldoc .              # generates docs/ from all annotated files
ldoc --dir out src/  # custom output directory
```

## LDoc vs. EmmyLua/LuaCATS

They serve different audiences: LDoc produces published reference documentation (HTML/text), while EmmyLua/LuaCATS annotations power live editor tooling. Many published libraries include both; small internal modules usually only need the editor-facing annotations.

## See Also

- [doc-emmylua-annotations](doc-emmylua-annotations.md)
- [doc-module-header](doc-module-header.md)
- [doc-readme-usage](doc-readme-usage.md)
