# block-reduce-inject

> Use .reduce/.inject with clear initial value

## Why It Matters

`.reduce` (alias `.inject`) accumulates values across an enumerable. Always provide an explicit initial value — without it, the first element is used as the initial value, which can produce surprising results (e.g., summing an empty array returns `nil` instead of `0`).

For simple sums/products, use `.sum` / `.product` directly.


## Bad

```ruby
def total(items)
  items.reduce { |sum, item| sum + item.price }
  # Empty items returns nil -- surprising
end

def histogram(items)
  items.reduce({}) do |h, item|
    h[item.category] = (h[item.category] || 0) + 1  # Mutating accumulator
    h
  end
end
```


## Good

```ruby
# Simple case -- use sum
def total(items)
  items.sum(&:price)
end

def total_with_tax(items)
  items.reduce(0) { |sum, item| sum + item.price_with_tax }
  # Empty array returns 0 -- correct
end

# For grouping/counting, each_with_object is cleaner:
def histogram(items)
  items.each_with_object(Hash.new(0)) do |item, counts|
    counts[item.category] += 1
  end
end
```


## See Also

- [block-with-object](./block-with-object.md)
- [block-group-by-partition](./block-group-by-partition.md)
