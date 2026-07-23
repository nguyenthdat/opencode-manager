# port-shellcheck-directive

> Use ShellCheck directives for bash-only scripts

## Why It Matters

ShellCheck validates scripts against the shell specified in the shebang. If your script uses Bash features with `#!/bin/sh` (or no directive), ShellCheck reports false positives. Adding `# shellcheck shell=bash` (or `sh`, `ksh`, `dash`) tells ShellCheck which shell dialect to validate against, resulting in accurate diagnostics.

## Bad

```bash
#!/usr/bin/env bash

# ShellCheck warns because it doesn't know this is bash
# SC2039: In POSIX sh, 'source' is not valid
source ./lib.sh

# SC2039: In POSIX sh, arrays are not supported
declare -a items=(a b c)

# SC2039: In POSIX sh, [[ ]] is not valid
if [[ -f "$file" ]]; then
    echo "exists"
fi
```

## Good

```bash
#!/usr/bin/env bash
# shellcheck shell=bash
# Now ShellCheck knows this is bash — no false POSIX warnings

source ./lib.sh
declare -a items=(a b c)
if [[ -f "$file" ]]; then
    echo "exists"
fi
```

## ShellCheck Directives

```bash
# Specify shell dialect
# shellcheck shell=bash    # Bash-specific features
# shellcheck shell=sh      # POSIX sh (strict)
# shellcheck shell=dash    # Debian Almquist shell
# shellcheck shell=ksh     # Korn shell

# Disable specific checks
# shellcheck disable=SC1090    # Can't follow non-constant source
# shellcheck disable=SC2034    # Variable appears unused
# shellcheck disable=SC2155    # Declare and assign separately

# Disable for a single line
source "$lib"  # shellcheck disable=SC1090

# Re-enable after disabling
# shellcheck disable=SC1091
source "${HOME}/.bashrc"
# shellcheck enable=SC1091
```

## ShellCheck Configuration File

```ini
# .shellcheckrc (project root)
# Applied to all scripts in the project

# Global disable
disable=SC1090,SC1091

# Source path for following sourced files
source-path=SCRIPTDIR
```

## See Also

- [sec-shellcheck-required](./sec-shellcheck-required.md) - Running ShellCheck
- [port-avoid-bashisms](./port-avoid-bashisms.md) - Avoiding Bash-specific features
