# debug-ps4-enhanced

> Set `PS4='+(${BASH_SOURCE}:${LINENO})...` for better traces

## Why It Matters

The default `set -x` trace output (`+ command`) is minimally useful — it shows the command but not where it came from. Customizing `PS4` adds filename, line number, and function name to each trace line, making it possible to navigate from trace output directly to the source code. This single line dramatically improves debugging efficiency.

## Bad

```bash
#!/usr/bin/env bash
set -x
# Default PS4 — just shows '+' prefix
# + process_file data.txt
# + mv data.tmp data.txt
# Which line? Which file? Which function? Unknown.
```

## Good

```bash
#!/usr/bin/env bash
# Enhanced PS4: file:line, function name, indented
export PS4='+(${BASH_SOURCE}:${LINENO}): ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'

set -x
process_file() {
    local file="$1"
    mv "${file}.tmp" "$file"
}
process_file data.txt
# Trace output:
# +(script.sh:10): main(): process_file data.txt
# +(script.sh:6): process_file(): local file=data.txt
# +(script.sh:7): process_file(): mv data.tmp data.txt
```

## PS4 Variable Options

```bash
# Full debugging PS4
export PS4='+ ${BASH_SOURCE:-$0}:${LINENO} ${FUNCNAME[0]:+(${FUNCNAME[0]}()) }'

# With timestamp
export PS4='+ [$(date -u +%T.%3N)] ${BASH_SOURCE}:${LINENO}: '

# With indentation by function depth
export PS4='+ ${BASH_SOURCE}:${LINENO}${FUNCNAME:+ (${FUNCNAME})}: '

# Minimal but useful
export PS4='+${LINENO}: '

# Colored (terminal only)
export PS4='+\033[36m${BASH_SOURCE}\033[0m:\033[33m${LINENO}\033[0m: '
```

## See Also

- [debug-set-x-trace](./debug-set-x-trace.md) - Using set -x
- [debug-stack-trace](./debug-stack-trace.md) - Stack traces in error handlers
