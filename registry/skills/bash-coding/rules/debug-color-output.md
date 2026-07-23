# debug-color-output

> Use `tput` or ANSI codes; check if output is terminal

## Why It Matters

Colorized output improves readability for log messages, warnings, and errors — but only when viewed on a terminal. Coloring output piped to a file or non-TTY destination produces garbage characters. Always check `[[ -t 1 ]]` (or the relevant file descriptor) before outputting color codes. Use `tput` for portability or hardcode ANSI escape codes for simplicity.

## Bad

```bash
#!/usr/bin/env bash

# Always colored — breaks in pipes, log files, CI
echo -e "\033[31mERROR: Something failed\033[0m"
# In a log file: ^[[31mERROR: Something failed^[[0m

# Hardcoded ANSI codes — no portability
RED='\033[0;31m'
NC='\033[0m'
echo -e "${RED}Error${NC}: message"
```

## Good

```bash
#!/usr/bin/env bash

# Detect terminal support
if [[ -t 2 ]]; then
    # Use tput for portability
    readonly RED="$(tput setaf 1 2>/dev/null || echo '')"
    readonly GREEN="$(tput setaf 2 2>/dev/null || echo '')"
    readonly YELLOW="$(tput setaf 3 2>/dev/null || echo '')"
    readonly BOLD="$(tput bold 2>/dev/null || echo '')"
    readonly RESET="$(tput sgr0 2>/dev/null || echo '')"
else
    readonly RED='' GREEN='' YELLOW='' BOLD='' RESET=''
fi

log_error() {
    echo "${RED}${BOLD}[ERROR]${RESET} $*" >&2
}

log_warn() {
    echo "${YELLOW}[WARN]${RESET} $*" >&2
}

log_success() {
    echo "${GREEN}[OK]${RESET} $*" >&2
}
```

## ANSI Fallback

```bash
# If tput fails, use hardcoded ANSI (works on most modern terminals)
init_colors() {
    if [[ -t 2 ]] && command -v tput &>/dev/null; then
        COLOR_RED="$(tput setaf 1)"
        COLOR_GREEN="$(tput setaf 2)"
        COLOR_RESET="$(tput sgr0)"
    elif [[ -t 2 ]]; then
        COLOR_RED=$'\033[31m'
        COLOR_GREEN=$'\033[32m'
        COLOR_RESET=$'\033[0m'
    else
        COLOR_RED=''
        COLOR_GREEN=''
        COLOR_RESET=''
    fi
}
```

## See Also

- [debug-log-function](./debug-log-function.md) - Structured log function
- [debug-no-echo-debug](./debug-no-echo-debug.md) - Debug on stderr
