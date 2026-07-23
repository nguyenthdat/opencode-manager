# anti-monkey-patching

> Don't monkey-patch core classes without refinements

## Why It Matters

Monkey-patching core classes (String, Array, Hash) affects ALL code globally, causing conflicts with gems and other developers' code. Use refinements to scope patches, or create module methods.

## Bad

```ruby
class String
  def to_bool
    %w[true 1 yes].include?(downcase)
  end
end
# ALL Strings everywhere now have to_bool -- conflicts possible
```


## Good

```ruby
module StringExtensions
  refine String do
    def to_bool
      %w[true 1 yes].include?(downcase)
    end
  end
end

class ConfigParser
  using StringExtensions  # Only active here
  def parse(value); value.to_bool; end
end
# Outside -- NoMethodError -- safe!
```


## See Also

- [meta-refinement-over-monkey](./meta-refinement-over-monkey.md)
