# anti-case-equality

> Don't use === operator directly; use case/when

## Why It Matters

The === operator is the case equality operator. Direct use is obscure -- it means different things for different classes (Regexp matches, Range includes, Class is_a?). Use case/when which makes intent clear.

## Bad

```ruby
if String === value
  value.upcase
elsif Integer === value
  value + 1
elsif /^\d+$/ === value.to_s
  value.to_s.to_i
end
```


## Good

```ruby
case value
when String
  value.upcase
when Integer
  value + 1
when /^\d+$/
  value.to_s.to_i
else
  value
end
```


## See Also

- [api-duck-type-over-class](./api-duck-type-over-class.md)
