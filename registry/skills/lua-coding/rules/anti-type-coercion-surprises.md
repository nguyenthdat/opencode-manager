# anti-type-coercion-surprises

> Anti-pattern: relying on implicit string↔number coercion

## Why It Matters

Lua automatically coerces strings to numbers in arithmetic contexts (`"5" + 1` works) and numbers to strings in concatenation contexts (`5 .. ""` works), but the two directions have different rules and edge cases (leading/trailing whitespace, hex strings, locale-dependent decimal separators in older versions) — relying on this instead of explicit `tonumber()`/`tostring()` makes bugs from malformed input harder to spot and version-portability harder to reason about.

## Bad

```lua
local function total_price(quantity, unit_price)
  return quantity * unit_price   -- if quantity ever arrives as "3abc" (e.g. from
                                   -- unsanitized user input), this errors
                                   -- unpredictably deep inside arithmetic,
                                   -- not at a clear validation boundary
end

-- Relying on comparison to silently coerce (it does NOT, actually --
-- this is a common trap: Lua does NOT coerce for ==, only for arithmetic/concat)
if quantity == 5 then  -- if quantity is the STRING "5", this is false, not true!
  ...
end
```

## Good

```lua
local function total_price(quantity, unit_price)
  local q = tonumber(quantity)
  if not q then
    error("quantity must be a number, got: " .. tostring(quantity), 2)
  end
  return q * unit_price
end

-- Be explicit at the boundary where a value's type is uncertain (e.g.
-- freshly parsed from JSON, a query string, or user input)
local qty_param = request.query.quantity   -- comes in as a string from a URL
local qty = tonumber(qty_param)
if not qty then
  return respond(400, "invalid quantity parameter")
end
```

## Lua Never Auto-Coerces for `==`

Unlike arithmetic/concatenation, `==` never coerces types: `"5" == 5` is always `false`, regardless of Lua version — a common source of confusion precisely because arithmetic coercion makes people expect coercion everywhere.

## See Also

- [err-validate-args](err-validate-args.md)
- [table-key-types](table-key-types.md)
- [anti-tostring-concat](anti-tostring-concat.md)
