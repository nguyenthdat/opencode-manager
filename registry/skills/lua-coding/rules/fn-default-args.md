# fn-default-args

> Emulate default arguments with `x = x or default`, but watch out for `false`

## Why It Matters

Lua has no native default-parameter syntax; the idiomatic substitute, `param = param or default`, works perfectly for `nil` parameters but has a well-known trap: it also replaces an explicitly passed `false` with the default, because `or` treats `false` the same as `nil`. Knowing when this trap applies (boolean parameters) versus when it's perfectly safe (everything else) matters.

## Bad

```lua
local function connect(host, use_ssl)
  use_ssl = use_ssl or true   -- BUG: caller can NEVER pass false to disable SSL,
                              -- because `false or true` is always `true`
  return do_connect(host, use_ssl)
end

connect("example.com", false)  -- SSL is silently forced on anyway!
```

## Good

```lua
-- For non-boolean defaults, `or` is safe and idiomatic
local function connect(host, port)
  port = port or 443
  return do_connect(host, port)
end

-- For boolean parameters, check explicitly for nil instead
local function connect_secure(host, use_ssl)
  if use_ssl == nil then
    use_ssl = true  -- default only applies when the caller omitted it
  end
  return do_connect(host, use_ssl)
end

connect_secure("example.com", false)  -- correctly disables SSL

-- Options-table style sidesteps the issue entirely and scales to many flags
local function connect_opts(host, opts)
  opts = opts or {}
  local use_ssl = opts.use_ssl
  if use_ssl == nil then use_ssl = true end
  local port = opts.port or 443
  return do_connect(host, port, use_ssl)
end
```

## See Also

- [api-options-table](api-options-table.md)
- [fn-multiple-returns](fn-multiple-returns.md)
- [anti-type-coercion-surprises](anti-type-coercion-surprises.md)
