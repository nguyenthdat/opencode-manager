# meta-method-missing

> Implement method_missing AND respond_to_missing? together

## Why It Matters

When you override `method_missing`, you must also override `respond_to_missing?`, or `respond_to?` will return `false` for dynamically handled methods. This breaks duck typing: callers using `respond_to?(:foo)` before `obj.foo` will incorrectly think the method doesn't exist.

Always call `super` in `method_missing` for methods you don't handle.


## Bad

```ruby
class DynamicFinder
  def method_missing(name, *args)
    if name.to_s.start_with?("find_by_")
      attribute = name.to_s.sub("find_by_", "")
      find { |obj| obj.public_send(attribute) == args.first }
    else
      super  # At least this is correct
    end
  end
  # Missing respond_to_missing? -- respond_to?(:find_by_name) returns false!
end
```


## Good

```ruby
class DynamicFinder
  def method_missing(name, *args, &block)
    if name.to_s.start_with?("find_by_")
      attribute = name.to_s.sub("find_by_", "")
      find { |obj| obj.public_send(attribute) == args.first }
    else
      super
    end
  end

  def respond_to_missing?(name, include_private = false)
    name.to_s.start_with?("find_by_") || super
  end
end

finder = DynamicFinder.new
finder.respond_to?(:find_by_name)  # => true
```


## See Also

- [meta-define-method](./meta-define-method.md)
- [meta-send-cautious](./meta-send-cautious.md)
