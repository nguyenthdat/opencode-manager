# err-validate-args

> Validate function arguments early and error with a clear, actionable message

## Why It Matters

Lua's dynamic typing means a wrong-typed argument often doesn't fail at the call site — it fails several calls later, deep inside library code, with a generic error like `attempt to concatenate a nil value` that gives no clue which argument or caller was at fault. Validating public-facing function arguments up front turns that into an immediate, precise error.

## Bad

```lua
local function create_user(name, age, email)
  -- no validation -- if `age` is accidentally a string, this blows up
  -- much later inside some unrelated arithmetic, far from the real bug
  return { name = name, age = age, email = email, adult = age >= 18 }
end

create_user("Alice", "30", "alice@example.com")
-- error (much later): attempt to compare string with number
```

## Good

```lua
local function create_user(name, age, email)
  if type(name) ~= "string" or name == "" then
    error("create_user: 'name' must be a non-empty string, got " .. type(name), 2)
  end
  if type(age) ~= "number" or age < 0 then
    error("create_user: 'age' must be a non-negative number, got " .. tostring(age), 2)
  end
  if type(email) ~= "string" or not email:find("@") then
    error("create_user: 'email' must look like an email address", 2)
  end
  return { name = name, age = age, email = email, adult = age >= 18 }
end

create_user("Alice", "30", "alice@example.com")
-- error immediately: create_user: 'age' must be a non-negative number, got 30
--                     (wait -- actually points precisely at the string "30" issue)
```

## A Small Validation Helper

```lua
local function check_type(value, expected, name, level)
  if type(value) ~= expected then
    error(("expected %s to be a %s, got %s"):format(name, expected, type(value)), (level or 1) + 1)
  end
  return value
end

local function set_volume(level)
  check_type(level, "number", "level", 2)
  audio.volume = level
end
```

## See Also

- [err-error-level](err-error-level.md)
- [err-assert-precondition](err-assert-precondition.md)
- [table-key-types](table-key-types.md)
