# err-error-level

> Pass an explicit `level` to `error()` so it blames the right call site

## Why It Matters

`error(message, level)`'s second argument controls which stack frame the position information is attached to: `1` (default) blames the function calling `error`, `2` blames *that* function's caller, and `0` adds no position info at all. A validation helper that always uses the default level blames itself instead of the buggy call site that passed bad arguments — the opposite of what's useful.

## Bad

```lua
local function check_positive(n, name)
  if n <= 0 then
    error(name .. " must be positive, got " .. n)  -- level 1: blames check_positive
  end
end

local function set_radius(r)
  check_positive(r, "radius")  -- bug is HERE, but the error will point at check_positive
  self.radius = r
end
```

## Good

```lua
local function check_positive(n, name)
  if n <= 0 then
    -- level 2: blame the caller of check_positive, i.e. the actual bug site
    error(name .. " must be positive, got " .. n, 2)
  end
end

local function set_radius(r)
  check_positive(r, "radius")  -- error now correctly points at THIS line
  self.radius = r
end
```

## Level 0: No Position Info

Useful when re-throwing an already-formatted error (e.g. one built from a table, or already containing its own location):

```lua
local ok, err = pcall(risky)
if not ok then
  error(err, 0)  -- re-throw without prepending a new (wrong) location
end
```

## See Also

- [err-validate-args](err-validate-args.md)
- [err-error-table](err-error-table.md)
- [err-assert-precondition](err-assert-precondition.md)
