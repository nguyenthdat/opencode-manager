# block-numbered-params

> Use _1, _2 for simple blocks (Ruby 2.7+)

## Why It Matters

Numbered parameters (`_1`, `_2`) eliminate the need to name block parameters when the names add no clarity. Use them for very short, obvious blocks where naming the parameter would just add noise.

Avoid numbered parameters when the block has logic beyond a single call, or when `_1` doesn't clearly indicate what it is.


## Bad

```ruby
# Unnecessary naming when the block is obvious
doubled = numbers.map { |number| number * 2 }
names = records.map { |record| record.name }
pairs = items.zip(more_items).map { |pair| pair.flatten }
```


## Good

```ruby
doubled = numbers.map { _1 * 2 }
names = records.map(&:name)  # Even better: use & shorthand

pairs = items.zip(more_items).map { [_1, _2] }

# With _2:
values = hash.map { "#{_1}=#{_2}" }

# But DON'T use when block is complex -- use named params:
items.select { |item| item.created_at > 1.week.ago && item.published? }
```


## See Also

- [block-ampersand-shorthand](./block-ampersand-shorthand.md)
- [block-yield-over-call](./block-yield-over-call.md)
