# name-is-has-boolean

> Use `is_`/`has_`/`can_` prefixes for boolean-returning functions

## Why It Matters

A function name that reads as a question (`is_valid`, `has_permission`, `can_edit`) tells the reader at the call site exactly what a `true`/`false` result means, without needing to check the implementation. A name like `check_valid` or `validate` is ambiguous about whether it returns a boolean, raises an error, or returns a validated value.

## Bad

```lua
local function valid(email)
  return email:match("^[%w.]+@[%w.]+$") ~= nil
end

local function permission(user, action)
  return user.role == "admin" or action == "read"
end

if valid(email) and permission(user, "write") then
  ...
end
```

## Good

```lua
local function is_valid_email(email)
  return email:match("^[%w.]+@[%w.]+$") ~= nil
end

local function has_permission(user, action)
  return user.role == "admin" or action == "read"
end

local function can_edit(user, document)
  return user.id == document.owner_id or has_permission(user, "write")
end

if is_valid_email(email) and can_edit(user, document) then
  ...
end
```

## See Also

- [name-snake-case-funcs](name-snake-case-funcs.md)
- [fn-default-args](fn-default-args.md)
- [name-event-handler-on](name-event-handler-on.md)
