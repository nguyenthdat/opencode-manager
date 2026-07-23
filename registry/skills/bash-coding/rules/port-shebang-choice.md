# port-shebang-choice

> Use `#!/usr/bin/env bash` for Bash; `#!/bin/sh` for POSIX

## Why It Matters

The shebang line determines which interpreter runs your script. `#!/usr/bin/env bash` finds Bash in the user's PATH, accommodating systems where Bash isn't at `/bin/bash` (e.g., NixOS, Homebrew on macOS). `#!/bin/sh` targets the POSIX shell, which may be dash, ash, or a minimal Bash. Choose intentionally — Bash-isms in a `#!/bin/sh` script will break on systems where `/bin/sh` is not Bash.

## Bad

```bash
#!/bin/bash
# Hardcoded path — breaks on systems where bash is elsewhere
# macOS Homebrew: /opt/homebrew/bin/bash
# FreeBSD: /usr/local/bin/bash
# NixOS: /nix/store/.../bin/bash

#!/bin/sh
# Then using Bash-specific features — breaks on dash/ash
[[ -f "$file" ]]        # Not POSIX!
declare -A map          # Bash-ism!
source ./lib.sh         # Not POSIX (use .)
```

## Good

```bash
#!/usr/bin/env bash
# Finds bash in PATH — portable across Unix systems
set -euo pipefail

# Bash-specific script
[[ -f "$file" ]] && process "$file"

# ---

#!/bin/sh
# POSIX-compatible script — runs on any POSIX shell
set -eu

# Only POSIX features
[ -f "$file" ] && process "$file"
. ./lib.sh   # POSIX equivalent of source
```

## Shebang Decision Guide

| Script Type | Shebang |
|-------------|---------|
| Bash script (uses arrays, [[ ]], ${!var}) | `#!/usr/bin/env bash` |
| POSIX sh (maximum portability) | `#!/bin/sh` |
| Cross-platform (bash commands with POSIX fallback) | `#!/usr/bin/env bash` |
| Alpine/Debian minimal containers | `#!/bin/sh` (dash) |

## See Also

- [port-avoid-bashisms](./port-avoid-bashisms.md) - Avoiding Bash-only features in POSIX scripts
- [port-shellcheck-directive](./port-shellcheck-directive.md) - ShellCheck directives for bash scripts
