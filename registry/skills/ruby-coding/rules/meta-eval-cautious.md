# meta-eval-cautious

> Avoid class_eval/instance_eval when possible

## Why It Matters

`class_eval` and `instance_eval` open classes/objects to execute arbitrary code strings or blocks. String-based eval is a security risk; block-based eval creates messy scope interactions and makes code hard to trace. Prefer `define_method`, `Module#include`, or `Module#prepend` instead.

If you must use `eval`, use the block form over the string form, and document why simpler alternatives don't work.


## Bad

```ruby
# String eval -- security risk and readability nightmare
%w[name email phone].each do |attr|
  User.class_eval <<-RUBY
    def #{attr}=(value)
      @#{attr} = value.strip.downcase
    end
  RUBY
end

# instance_eval on a parameter -- unclear what 'self' is
def configure(&block)
  @config.instance_eval(&block)
end
```


## Good

```ruby
# Use define_method with a block instead
%w[name email phone].each do |attr|
  User.define_method("#{attr}=") do |value|
    instance_variable_set("@#{attr}", value.strip.downcase)
  end
end

# Use yield with explicit parameter
def configure
  yield @config if block_given?
end

# Or for complex DSLs, use a dedicated builder
def configure(&block)
  builder = ConfigBuilder.new(@config)
  builder.instance_eval(&block)
  builder.result
end
```


## See Also

- [meta-define-method](./meta-define-method.md)
- [meta-refinement-over-monkey](./meta-refinement-over-monkey.md)
- [sec-no-eval](./sec-no-eval.md)
