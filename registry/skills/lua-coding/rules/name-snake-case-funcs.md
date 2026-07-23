# name-snake-case-funcs

> Use `snake_case` for functions and variables

## Why It Matters

`snake_case` is the overwhelmingly dominant convention across the Lua standard library (`table.insert`, `string.gsub`, `os.getenv`), LuaRocks packages, Neovim's runtime Lua, OpenResty, and LÖVE. Deviating (camelCase, PascalCase for functions) makes code stick out and reads as foreign within any of these ecosystems.

## Bad

```lua
local function getUserById(userId)
  local userData = fetchFromDatabase(userId)
  return userData
end

local isValidEmail = function(emailAddress) ... end
```

## Good

```lua
local function get_user_by_id(user_id)
  local user_data = fetch_from_database(user_id)
  return user_data
end

local function is_valid_email(email_address) ... end

-- Matches the standard library's own convention:
table.insert(t, v)
string.format("%d", n)
os.getenv("HOME")
```

## See Also

- [name-pascal-case-classes](name-pascal-case-classes.md)
- [name-screaming-constants](name-screaming-constants.md)
- [name-is-has-boolean](name-is-has-boolean.md)
