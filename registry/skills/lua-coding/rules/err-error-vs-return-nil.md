# err-error-vs-return-nil

> Choose `error()` vs. returning `nil, err` deliberately, based on severity

## Why It Matters

Lua gives you two entirely different failure-signaling mechanisms and it's tempting to mix them arbitrarily. The convention that keeps a codebase predictable: use `error()` (an exception-like, stack-unwinding throw) for *programming bugs and truly exceptional conditions* that the immediate caller isn't expected to handle inline, and return `nil, err` for *expected, recoverable* runtime outcomes that callers routinely need to branch on.

## Bad

```lua
-- "User not found" is a completely normal, expected outcome -- throwing
-- forces every single caller to wrap this in pcall just to do a lookup
local function find_user(id)
  local user = db.lookup(id)
  if not user then
    error("user not found: " .. id)
  end
  return user
end

-- Meanwhile, a genuine programming bug (bad argument type) is swallowed
-- as a quiet nil instead of failing loudly during development
local function set_age(user, age)
  if type(age) ~= "number" then
    return nil, "age must be a number"  -- this should have been a hard error
  end
  user.age = age
  return user
end
```

## Good

```lua
-- Expected, recoverable outcome: nil, err -- caller decides what to do
local function find_user(id)
  local user = db.lookup(id)
  if not user then
    return nil, "user not found: " .. id
  end
  return user
end

local user, err = find_user(42)
if not user then
  log.info(err)  -- routine, no big deal
  return show_signup_prompt()
end

-- Programming bug / broken invariant: error() -- fail fast and loud
local function set_age(user, age)
  assert(type(age) == "number", "age must be a number, got " .. type(age))
  user.age = age
  return user
end
```

## Rule of Thumb

Ask: "should a well-written caller be expected to check for this every time?" If yes, `nil, err`. If the answer is "this should never happen unless something is broken," use `error()`/`assert()`.

## See Also

- [err-nil-err-pattern](err-nil-err-pattern.md)
- [err-assert-precondition](err-assert-precondition.md)
- [anti-ignore-pcall-result](anti-ignore-pcall-result.md)
