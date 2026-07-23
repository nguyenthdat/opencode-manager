# name-block-variables-verbose

> Name block params meaningfully

## Why It Matters

Block parameters should have descriptive names, not single letters (except well-known conventions like k, v for hash key-value or i for index). Meaningful names make blocks self-documenting.

## Bad

```ruby
users.map { |x| x.name }
items.each_with_index { |e, i| puts "#{i}: #{e}" }
```


## Good

```ruby
users.map { |user| user.name }
items.each_with_index { |item, index| puts "#{index}: #{item}" }
# Single-letter ok for common conventions:
hash.each { |k, v| puts "#{k}=#{v}" }
```


## See Also

- [block-ampersand-shorthand](./block-ampersand-shorthand.md)
- [block-numbered-params](./block-numbered-params.md)
