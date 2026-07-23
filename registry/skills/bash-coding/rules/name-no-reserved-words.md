# name-no-reserved-words

> Avoid bash keywords as function/variable names

## Why It Matters

Bash has many reserved words and builtins: `if`, `then`, `else`, `for`, `while`, `do`, `time`, `function`, `select`, `until`, `case`, `coproc`. Using these as function or variable names causes syntax errors or unexpected behavior. Additionally, avoid overriding common builtins like `echo`, `cd`, `test`, `kill` unless you have a very specific reason and use `builtin`/`command` to access the original.

## Bad

```bash
# Reserved word as function name — syntax error
if() { echo "conditional"; }     # ERROR
for() { loop "$@"; }             # ERROR

# Builtin override — confusing and dangerous
echo() { command echo "[$(date)]: $*"; }
cd() { builtin cd "$1" && ls; }
kill() { echo "Don't kill!"; }   # Breaks actual kill

# Variable naming collision
declare time="now"               # time is a reserved word
```

## Good

```bash
# Use descriptive names that don't shadow builtins
check_condition() { :; }
loop_over_files() { :; }
echo_timestamp() { command echo "[$(date)]: $*"; }
change_dir() { builtin cd "$1" && ls; }
terminate_process() { command kill "$1"; }

# If you must override, always provide access to the original
cd() {
    builtin cd "$@" || return 1
    update_prompt
}

# Avoid these keyword names:
# case do done elif else esac fi for function if in select then until while time
```

## Reserved Words (Can't Use)

```bash
# These are Bash reserved words — never use them:
! case coproc do done elif else esac fi for function if in
select then until while { } time [[ ]]
```

## See Also

- [name-functions-lowercase](./name-functions-lowercase.md) - Function naming conventions
- [name-globals-caps](./name-globals-caps.md) - Global variable naming
