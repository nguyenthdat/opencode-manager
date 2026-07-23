# io-avoid-cat-pipe

> Avoid `cat file | cmd`; use `cmd < file` or `cmd file`

## Why It Matters

`cat file | cmd` spawns an unnecessary `cat` process and an extra pipe. It's slower, uses more memory, and breaks the command's ability to seek in the input (important for tools like `zip`, `tar`, or `less`). Most commands accept files as arguments or can read from redirected stdin (`cmd < file`), which is faster by one fork per invocation.

## Bad

```bash
# Useless use of cat
cat file.txt | grep "pattern"
cat access.log | wc -l
cat data.json | jq '.items'
cat config.ini | while IFS= read -r line; do
    process "$line"
done
```

## Good

```bash
# grep reads file directly
grep "pattern" file.txt

# Redirect input
wc -l < access.log

# jq accepts file argument
jq '.items' data.json

# Read loop with direct redirection
while IFS= read -r line; do
    process "$line"
done < config.ini

# Multiple files — cat is actually needed
cat file1.txt file2.txt | process_combined_input
# ^ This is the legitimate use of cat
```

## When cat Is Correct

```bash
# 1. Concatenating multiple files
cat part1.txt part2.txt part3.txt > full.txt

# 2. Prepending data without modifying a file
cat header.txt - footer.txt < body.txt > output.txt

# 3. Reading from stdin explicitly (for clarity)
echo "$data" | cat - file.txt > output.txt   # "-" means stdin

# 4. Avoiding permission issues (rare)
cat file.txt | sudo tee /protected/path > /dev/null
```

## See Also

- [perf-avoid-cat-useless](./perf-avoid-cat-useless.md) - Useless use of cat as performance anti-pattern
- [io-read-while-pipe](./io-read-while-pipe.md) - Read loop patterns
