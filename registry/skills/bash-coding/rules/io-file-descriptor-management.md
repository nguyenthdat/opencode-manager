# io-file-descriptor-management

> Use `exec` for custom file descriptors

## Why It Matters

Shell scripts are limited to file descriptors 0 (stdin), 1 (stdout), and 2 (stderr) by default. Custom file descriptors (3-9) allow simultaneous access to multiple input/output streams — reading from a file while piping to a log, or sending different output streams to different destinations. `exec` manipulates these descriptors elegantly.

## Bad

```bash
# Reopening a file repeatedly — inefficient
for i in {1..100}; do
    echo "line $i" >> output.log
done

# Can't separate stdout and status messages
echo "Processing..."      # Goes to stdout with data
output_data              # Data mixes with log messages
```

## Good

```bash
# Open file descriptor once, write many times
exec 3> output.log
for i in {1..100}; do
    echo "line $i" >&3
done
exec 3>&-   # Close when done

# Separate stdout from status/logging
exec 3>&1                         # Save original stdout to fd 3
exec 1> output.txt                # Redirect stdout to file
echo "Status: processing..." >&3  # Status goes to terminal (via fd 3)
process_data                      # Output goes to file (via fd 1)
exec 1>&3                         # Restore stdout
exec 3>&-                         # Close fd 3

# Read from multiple inputs
exec 3< file_a.txt
exec 4< file_b.txt
while IFS= read -r line_a <&3 && IFS= read -r line_b <&4; do
    echo "${line_a} | ${line_b}"
done
exec 3<&- 4<&-

# Capture stderr for logging while seeing stdout
exec 3>&1
{
    output="$(main_command 2>&1 1>&3)"
    status=$?
} 3>&1
echo "Errors: $output"
```

## File Descriptor Quick Reference

```bash
exec 3>file      # Open for writing (truncate)
exec 3>>file     # Open for appending
exec 3<file      # Open for reading
exec 3<>file     # Open for reading and writing
exec 3>&-        # Close fd 3
exec 3>&1        # Duplicate fd 1 to fd 3 (3 points where 1 points)
exec 3>&4-       # Move fd 4 to fd 3, then close fd 4
```

## See Also

- [io-stderr-redirect](./io-stderr-redirect.md) - Stderr redirection
- [debug-no-echo-debug](./debug-no-echo-debug.md) - Stderr for debug output
