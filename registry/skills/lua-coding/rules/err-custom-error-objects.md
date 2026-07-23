# err-custom-error-objects

> Create custom error "classes" via metatables for structured handling

## Why It Matters

A plain table with a `kind` field works for simple cases, but as an application grows, giving errors a real "type" (via a metatable, with `__tostring` and helper methods like `:is(kind)`) makes error handling read like typed exception handling in other languages, while still being plain Lua tables under the hood — pcall/error compatible, introspectable, and serializable.

## Bad

```lua
-- Every error site reinvents the shape; no shared way to check "is this a NotFoundError?"
error({ type = "NotFound", msg = "user 42 not found" })
error({ kind = "not_found", message = "user 42 not found" })  -- inconsistent shape
```

## Good

```lua
local AppError = {}
AppError.__index = AppError
AppError.__tostring = function(self)
  return ("%s: %s"):format(self.kind, self.message)
end

function AppError.new(kind, message, extra)
  return setmetatable({ kind = kind, message = message, extra = extra }, AppError)
end

function AppError:is(kind)
  return self.kind == kind
end

local NotFoundError = setmetatable({}, { __index = AppError })
NotFoundError.__index = NotFoundError
NotFoundError.__tostring = AppError.__tostring

function NotFoundError.new(resource, id)
  local self = AppError.new("not_found", resource .. " " .. tostring(id) .. " not found")
  return setmetatable(self, NotFoundError)
end

-- Usage
local function find_user(id)
  local user = db.lookup(id)
  if not user then
    error(NotFoundError.new("user", id))
  end
  return user
end

local ok, err = pcall(find_user, 42)
if not ok then
  if type(err) == "table" and err:is("not_found") then
    respond(404, tostring(err))
  else
    respond(500, "internal error")
  end
end
```

## See Also

- [err-error-table](err-error-table.md)
- [meta-class-pattern](meta-class-pattern.md)
- [err-error-vs-return-nil](err-error-vs-return-nil.md)
