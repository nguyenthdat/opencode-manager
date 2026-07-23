# embed-openresty-phases

> Respect OpenResty's request-processing phases (init/access/content/log)

## Why It Matters

OpenResty (`lua-nginx-module`) runs Lua code at specific nginx request-processing phases (`init_by_lua`, `init_worker_by_lua`, `rewrite_by_lua`, `access_by_lua`, `content_by_lua`, `header_filter_by_lua`, `body_filter_by_lua`, `log_by_lua`), each with different capabilities and restrictions — some APIs (`ngx.say`, cosocket) are only usable in certain phases, and calling the wrong API from the wrong phase raises a runtime error (`API disabled in the current context`).

## Bad

```lua
-- Calling ngx.say (writes response body) from log_by_lua, which runs
-- AFTER the response has already been sent -- this is simply invalid
-- log_by_lua_block { ngx.say("done") }  -- error: API disabled in this context

-- Doing expensive per-worker setup in content_by_lua, re-running it on
-- every single request instead of once per worker process
content_by_lua_block {
  local big_table = load_huge_config_from_disk()  -- reloaded on EVERY request!
  ngx.say(process(big_table))
}
```

## Good

```lua
-- init_worker_by_lua_block: runs once per worker process, right place for
-- expensive one-time setup shared across all requests handled by this worker
init_worker_by_lua_block {
  _G.shared_config = load_huge_config_from_disk()
}

-- access_by_lua_block: the idiomatic phase for auth/rate-limiting checks,
-- before the request reaches content generation
access_by_lua_block {
  local ok = check_auth_token(ngx.req.get_headers())
  if not ok then
    ngx.status = 403
    ngx.exit(403)
  end
}

-- content_by_lua_block: generates the actual response body
content_by_lua_block {
  ngx.say(process(_G.shared_config))
}

-- log_by_lua_block: runs after the response is sent -- good for metrics/logging
-- only, not for anything that writes to the response
log_by_lua_block {
  record_metrics(ngx.status, ngx.var.request_time)
}
```

## See Also

- [embed-openresty-non-blocking](embed-openresty-non-blocking.md)
- [api-avoid-side-effects-on-require](api-avoid-side-effects-on-require.md)
- [embed-preserve-target-version](embed-preserve-target-version.md)
