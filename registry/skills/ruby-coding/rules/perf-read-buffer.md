# perf-read-buffer

> Read files in buffered chunks for large files

## Why It Matters

File.read loads the entire file into memory -- dangerous for large files. Process large files line-by-line with File.foreach or in chunks with read(chunk_size).

## Bad

```ruby
# Loads 5GB log file into memory -- OOM!
data = File.read("huge_log.txt")
data.each_line { |line| process(line) }
```


## Good

```ruby
# Line by line -- constant memory:
File.foreach("huge_log.txt") { |line| process(line) }

# Buffered reading (binary):
File.open("large_file.bin", "rb") do |f|
  buffer = +""
  while f.read(65536, buffer)  # 64KB chunks
    process(buffer)
  end
end
```


## See Also

- [block-lazy-enumerators](./block-lazy-enumerators.md)
- [perf-avoid-object-alloc](./perf-avoid-object-alloc.md)
