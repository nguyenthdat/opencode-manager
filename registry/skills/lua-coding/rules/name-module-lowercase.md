# name-module-lowercase

> Use short, lowercase module and file names

## Why It Matters

`require()` paths are case-sensitive on most filesystems Lua runs on (Linux, and case-sensitive-configured macOS/Windows mounts), so inconsistent casing between the file on disk and the `require` string is a common source of "works on my machine" bugs. Sticking to all-lowercase, short module names — matching the standard library (`string`, `table`, `os`, `io`) and the wider ecosystem (LuaRocks package names are conventionally lowercase) — avoids the whole class of problem.

## Bad

```
lib/
  HttpClient.lua
  JSONParser.lua
  Config_Loader.lua
```

```lua
local http = require("lib.HttpClient")     -- breaks on case-sensitive filesystems
                                             -- if anyone typos the case
```

## Good

```
lib/
  http_client.lua
  json_parser.lua
  config_loader.lua
```

```lua
local http = require("lib.http_client")
local json = require("lib.json_parser")
local config = require("lib.config_loader")
```

## LuaRocks Package Naming

LuaRocks package names are conventionally all-lowercase, often hyphenated (`lua-cjson`, `luasocket`, `busted`) — matching this convention makes your module's identity consistent whether referenced via `require` or installed via `luarocks install`.

## See Also

- [api-require-path](api-require-path.md)
- [proj-require-path-convention](proj-require-path-convention.md)
- [proj-rockspec-luarocks](proj-rockspec-luarocks.md)
