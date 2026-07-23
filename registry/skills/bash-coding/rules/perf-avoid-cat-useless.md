# perf-avoid-cat-useless

> Avoid useless use of cat (UUOC)

## Why It Matters

`cat file | cmd` spawns an unnecessary `cat` process and creates a pipe. Most commands accept files as arguments directly (`grep pattern file`) or can read stdin via redirection (`cmd < file`). Eliminating UUOC saves a fork per invocation and allows commands to optimize file access (memory mapping, seeking). In tight loops, this adds up significantly.

## Bad

```bash
# Useless cat — extra process, extra pipe
cat access.log | grep "ERROR"
cat data.json | jq '.items'
cat /etc/hosts | wc -l
cat config.ini | while IFS= read -r line; do process "$line"; done
```

## Good

```bash
# Direct file access — no extra process
grep "ERROR" access.log
jq '.items' data.json
wc -l < /etc/hosts
while IFS= read -r line; do process "$line"; done < config.ini

# Concatenating multiple files — this IS the proper use of cat
cat part1.txt part2.txt part3.txt | process_combined
```

## UUOC Detection

```bash
# ShellCheck catches most UUOC:
# SC2002: Useless cat. Consider 'cmd < file | ..' or 'cmd file | ..' instead.

# The pattern: cat FILE | COMMAND
# If COMMAND reads from stdin and does NOT accept file args, use <:
# cat file | cmd ---> cmd < file

# If COMMAND accepts file arguments, pass directly:
# cat file | grep pattern ---> grep pattern file
# cat file | wc -l ---> wc -l < file   # wc needs < for just the count
```

## When cat IS Correct

```bash
# 1. Concatenating multiple files
cat file1 file2 file3 | process

# 2. Prepending stdin to a file
printf 'header\n' | cat - file.txt

# 3. Avoiding permission issues (rare)
cat protected_file | sudo tee output > /dev/null
```

## See Also

- [io-avoid-cat-pipe](./io-avoid-cat-pipe.md) - I/O redirection alternative
- [perf-avoid-fork](./perf-avoid-fork.md) - Avoiding unnecessary forks
