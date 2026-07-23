# err-error-table

> Use `error()` with a table/object for structured errors, not just a string

## Why It Matters

`error()` accepts any value, not just a string. Passing a plain string forces every caller to parse the message to figure out what went wrong (fragile, locale-dependent, breaks if the wording changes). Passing a table with a stable `code`/`kind` field lets callers branch on error type reliably, similar to typed exceptions in other languages.

## Bad

```lua
local function withdraw(account, amount)
  if amount > account.balance then
    error("insufficient funds for account " .. account.id)
  end
  account.balance = account.balance - amount
end

-- Caller has to string-match to distinguish error kinds -- fragile
local ok, err = pcall(withdraw, account, 1000)
if not ok and err:find("insufficient funds") then
  show_topup_dialog()
end
```

## Good

```lua
local ErrorKind = { INSUFFICIENT_FUNDS = "insufficient_funds", ACCOUNT_LOCKED = "account_locked" }

local function withdraw(account, amount)
  if account.locked then
    error({ kind = ErrorKind.ACCOUNT_LOCKED, account_id = account.id })
  end
  if amount > account.balance then
    error({
      kind = ErrorKind.INSUFFICIENT_FUNDS,
      account_id = account.id,
      requested = amount,
      available = account.balance,
    })
  end
  account.balance = account.balance - amount
end

local ok, err = pcall(withdraw, account, 1000)
if not ok then
  if type(err) == "table" and err.kind == ErrorKind.INSUFFICIENT_FUNDS then
    show_topup_dialog(err.available)
  else
    log.error("unexpected error: " .. tostring(err))
  end
end
```

## Giving Error Tables a `__tostring`

```lua
local AppError = {}
AppError.__index = AppError
AppError.__tostring = function(e) return ("[%s] %s"):format(e.kind, e.message) end

local function new_error(kind, message, extra)
  return setmetatable({ kind = kind, message = message, extra = extra }, AppError)
end

error(new_error("not_found", "user does not exist", { user_id = 42 }))
```

## See Also

- [err-custom-error-objects](err-custom-error-objects.md)
- [err-error-vs-return-nil](err-error-vs-return-nil.md)
- [err-error-level](err-error-level.md)
