# lint-unused-variable

> Fix unused-variable warnings instead of suppressing them

## Why It Matters

An unused local variable is nearly always either dead code left over from a refactor, or a bug where the variable was *meant* to be used but a later reference was accidentally deleted/renamed — suppressing the warning (rather than investigating and fixing it) discards a genuinely useful signal, not just noise.

## Bad

```lua
local function process_order(order)
  local total = calculate_total(order)   -- luacheck: ignore 211 -- unused, suppressed
  local tax = calculate_tax(order)
  return order.subtotal + tax   -- BUG: should have used `total`, not order.subtotal!
end
```

## Good

```lua
-- Investigating the warning reveals the actual bug: `total` should have
-- been used in the return expression
local function process_order(order)
  local total = calculate_total(order)
  local tax = calculate_tax(order)
  return total + tax   -- fixed: uses the value that was actually computed
end

-- If a variable is genuinely, deliberately unused (e.g. a required callback
-- parameter whose signature you don't control), name it with a leading
-- underscore -- luacheck (and most linters) recognize this as "intentionally
-- unused" and won't warn:
local function on_event(_event_name, payload)
  process(payload)
end
```

## When It's a Placeholder for Future Use

If a variable is unused because the feature using it isn't implemented yet, prefer a `-- TODO` comment explaining why over silently suppressing the warning — that way the linter's signal stays meaningful for everyone else's code.

## See Also

- [lint-ignore-directives](lint-ignore-directives.md)
- [name-private-underscore](name-private-underscore.md)
- [lint-luacheck-ci](lint-luacheck-ci.md)
