# doc-type-alias

> Use `---@alias`/`---@field` for complex, reused shapes

## Why It Matters

When several functions share the same complex table shape (an options table, a response record), repeating the full inline shape in every doc comment is verbose and drifts out of sync as the shape evolves. `---@alias` (for simple unions) and a shared `---@class` (for structured shapes) let you define the shape once and reference it everywhere.

## Bad

```lua
---@param opts { timeout: number?, retries: number?, verify_ssl: boolean? }
local function get(url, opts) ... end

---@param opts { timeout: number?, retries: number?, verify_ssl: boolean? }
local function post(url, body, opts) ... end

---@param opts { timeout: number?, retries: number?, verify_ssl: boolean? }
local function delete(url, opts) ... end
-- The shape is repeated three times; a change to one place is easy to miss elsewhere
```

## Good

```lua
---@class HttpRequestOpts
---@field timeout number? Request timeout in seconds (default: 30)
---@field retries number? Number of retries on failure (default: 3)
---@field verify_ssl boolean? Verify TLS certificates (default: true)

---@param url string
---@param opts HttpRequestOpts?
local function get(url, opts) ... end

---@param url string
---@param body table
---@param opts HttpRequestOpts?
local function post(url, body, opts) ... end

---@param url string
---@param opts HttpRequestOpts?
local function delete(url, opts) ... end
```

## Simple Unions With `---@alias`

```lua
---@alias LogLevel "debug" | "info" | "warn" | "error"

---@param level LogLevel
local function set_log_level(level) ... end
```

## See Also

- [doc-class-annotations](doc-class-annotations.md)
- [doc-emmylua-annotations](doc-emmylua-annotations.md)
- [api-options-table](api-options-table.md)
