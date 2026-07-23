# fn-option-parsing

> Use `getopts` for argument parsing; avoid manual `$1` `$2` loops

## Why It Matters

Manual argument parsing with `while`/`case` on `$1` is verbose, error-prone, and doesn't handle combined short flags (`-abc`), optional arguments, or invalid flag detection. `getopts` (POSIX builtin) provides standardized option parsing with automatic error messages, proper argument shifting, and `OPTARG`/`OPTIND` management. For long options (GNU style), use a manual loop or an external parser like `getopt`.

## Bad

```bash
# Manual parsing — verbose, fragile, doesn't support -abc
while (($# > 0)); do
    case "$1" in
        -h) show_help ;;
        -f) file="$2"; shift ;;    # Forgot to check if $2 exists!
        -v) verbose=true ;;
        -o) output_dir="$2"; shift ;;
        *) echo "Unknown: $1"; exit 1 ;;
    esac
    shift
done
# -fo file.txt? Doesn't work. -abc? Nope.
```

## Good

```bash
# getopts for short options (POSIX)
while getopts ":hvf:o:" opt; do
    case "$opt" in
        h) show_help ;;
        v) verbose=true ;;
        f) file="$OPTARG" ;;
        o) output_dir="$OPTARG" ;;
        :) echo "Option -${OPTARG} requires an argument" >&2; exit 2 ;;
        ?) echo "Invalid option: -${OPTARG}" >&2; exit 2 ;;
    esac
done
shift $((OPTIND - 1))   # Remove parsed options; $@ now has positional args

# Manual loop for long options (GNU style)
while (($# > 0)); do
    case "$1" in
        -h|--help)
            show_help
            ;;
        -v|--verbose)
            verbose=true
            shift
            ;;
        -f|--file)
            file="${2:?--file requires an argument}"
            shift 2
            ;;
        --output-dir=*)
            output_dir="${1#*=}"
            shift
            ;;
        --output-dir)
            output_dir="${2:?--output-dir requires an argument}"
            shift 2
            ;;
        --)
            shift; break
            ;;
        -*)
            echo "Unknown option: $1" >&2
            exit 2
            ;;
        *)
            break
            ;;
    esac
done
```

## getopts vs Manual

| Feature | getopts | Manual Loop |
|---------|---------|-------------|
| Short flags (`-ab`) | Yes | No |
| Combined flags (`-abc`) | Yes | Manual work |
| Required arguments | Automatic | Manual check |
| Long options (`--help`) | No | Yes |
| `--` end-of-options | Automatic | Manual |
| POSIX compliant | Yes | Depends on implementation |

## See Also

- [fn-usage-help](./fn-usage-help.md) - Usage function with help text
- [port-posix-test](./port-posix-test.md) - POSIX compatibility
