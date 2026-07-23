# block-yield-over-call

> Prefer yield over block.call for performance

## Why It Matters

`yield` is significantly faster than `block.call` (and `Proc#call`) because it avoids object allocation and method dispatch overhead. In hot paths, always use `yield` when the block is passed implicitly.

Use `block.call` only when you need to store the block in a variable (e.g., passing it to another method) or when working with explicit `&block` parameters.


## Bad

```ruby
def benchmark(&block)
  start = Time.now
  block.call   # Slower: Proc allocation + method dispatch
  Time.now - start
end

def with_retry(max: 3, &block)
  attempts = 0
  begin
    block.call
  rescue StandardError
    attempts += 1
    retry if attempts < max
  end
end
```


## Good

```ruby
def benchmark
  start = Time.now
  yield  # Faster: no Proc allocation
  Time.now - start
end

def with_retry(max: 3)
  attempts = 0
  begin
    yield
  rescue StandardError
    attempts += 1
    retry if attempts < max
  end
end

# Use block parameter only when needed:
def wrap_and_pass(&block)
  wrapper { block.call }  # Must use block.call to pass it elsewhere
end
```


## See Also

- [block-ampersand-shorthand](./block-ampersand-shorthand.md)
- [perf-avoid-object-alloc](./perf-avoid-object-alloc.md)
