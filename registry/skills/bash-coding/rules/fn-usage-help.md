# fn-usage-help

> Provide `usage()` function with help text

## Why It Matters

Every script should document its expected arguments, options, and behavior. A `usage()` function provides self-documentation that users can access with `--help` or when they provide incorrect arguments. This standard pattern reduces support burden and makes scripts immediately usable by new users. It also serves as a specification for what the script does.

## Bad

```bash
#!/usr/bin/env bash
set -euo pipefail

# No usage function — users must read the source
if [ "$#" -lt 2 ]; then
    echo "Need more args" >&2
    exit 1
fi
input="$1"
output="$2"
convert "$input" "$output"
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [OPTIONS] <input> <output>

Convert input file to output format.

OPTIONS:
  -h, --help       Show this help message and exit
  -v, --verbose    Enable verbose output
  -q, --quality N  Set output quality (1-100, default: 80)
  -f, --format FMT Output format: jpg, png, webp (default: png)

EXAMPLES:
  ${SCRIPT_NAME} input.jpg output.png
  ${SCRIPT_NAME} -q 90 -f webp photo.jpg thumb.webp

ENVIRONMENT:
  CONVERT_TMPDIR    Temporary directory (default: /tmp)
EOF
    exit "${1:-0}"
}

main() {
    local verbose=false
    local quality=80
    local format="png"

    while (($# > 0)); do
        case "$1" in
            -h|--help) usage ;;
            -v|--verbose) verbose=true; shift ;;
            -q|--quality) quality="$2"; shift 2 ;;
            -f|--format) format="$2"; shift 2 ;;
            --) shift; break ;;
            -*) echo "Unknown option: $1" >&2; usage 2 ;;
            *) break ;;
        esac
    done

    if (($# < 2)); then
        echo "ERROR: Missing required arguments" >&2
        usage 2
    fi

    local input="$1" output="$2"
    if "$verbose"; then
        echo "Converting ${input} -> ${output} (${format}, q=${quality})"
    fi
    convert -quality "$quality" "$input" "${output%.*}.${format}"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

## See Also

- [fn-option-parsing](./fn-option-parsing.md) - Using getopts
- [fn-main-function](./fn-main-function.md) - Main function pattern
