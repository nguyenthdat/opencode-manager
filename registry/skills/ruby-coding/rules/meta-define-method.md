# meta-define-method

> Use define_method for dynamic method creation

## Why It Matters

`define_method` creates methods at runtime based on dynamic input. Unlike `class_eval` with string interpolation, `define_method` creates a closure that captures the surrounding scope, avoiding string-injection risks and enabling proper garbage collection.

Use `define_method` when method names or behavior depend on runtime data. For static methods, use `def`.


## Bad

```ruby
%w[published draft archived].each do |status|
  class_eval <<-RUBY, __FILE__, __LINE__ + 1
    def #{status}?
      status == "#{status}"
    end
  RUBY
end
# String interpolation risk, poor stack traces, hard to read
```


## Good

```ruby
%w[published draft archived].each do |status|
  define_method("#{status}?") do
    self.status == status
  end
end

# With variable capture (closure):
STATUSES = %w[pending confirmed shipped delivered].freeze
STATUSES.each do |status|
  define_method("#{status}?") { self.status == status }
  define_method("#{status}!") { update!(status: status) }
end
```


## See Also

- [meta-method-missing](./meta-method-missing.md)
- [meta-macro-module](./meta-macro-module.md)
- [meta-eval-cautious](./meta-eval-cautious.md)
