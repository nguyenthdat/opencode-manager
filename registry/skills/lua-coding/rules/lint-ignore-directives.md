# lint-ignore-directives

> Use targeted `luacheck` ignore comments instead of disabling checks broadly

## Why It Matters

Disabling an entire warning code project-wide (or worse, disabling all warnings for a whole file) to silence one legitimate false positive throws away the linter's protection for every other line in that file/project — a scoped, per-line ignore comment keeps the rest of the codebase fully checked.

## Bad

```lua
-- .luacheckrc -- disables W211 (unused variable) EVERYWHERE, project-wide,
-- just to silence one intentionally-unused variable in one file
ignore = { "211" }
```

## Good

```lua
-- Just the one line that needs it, with a comment explaining why
local function on_event(event_name, payload) -- luacheck: ignore payload
  log("event fired: " .. event_name)
  -- payload intentionally unused for now; kept for API-signature stability
end

-- Or scope the ignore to a specific warning code, on just this line
local unused_for_now = compute_debug_value()  -- luacheck: ignore 211
```

```lua
-- If a whole FILE genuinely needs a narrower std (e.g. a generated file
-- you don't want to hand-edit), scope the override to that file only in
-- .luacheckrc rather than disabling checks globally:
files["generated/schema.lua"] = { ignore = { "631" } }  -- line-too-long, generated code
```

## See Also

- [lint-luacheckrc-config](lint-luacheckrc-config.md)
- [lint-unused-variable](lint-unused-variable.md)
- [name-private-underscore](name-private-underscore.md)
