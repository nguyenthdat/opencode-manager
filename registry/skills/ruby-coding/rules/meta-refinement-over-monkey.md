# meta-refinement-over-monkey

> Use refinements over global monkey patching

## Why It Matters

Monkey patching core classes (String, Array, Hash) changes behavior globally, breaking libraries and creating conflicts. Refinements (Ruby 2.0+) scope modifications to the module where they're activated with `using`, making them opt-in and explicit.

Use refinements in gems and libraries. In application code, prefer extension methods or wrapper objects over modifying core classes.


## Bad

```ruby
class String
  def to_bool
    %w[true 1 yes].include?(downcase)
  end
end
# Every String everywhere now has to_bool -- conflicts possible

class Array
  def to_sentence
    "#{self[0..-2].join(', ')} and #{last}"
  end
end
# Conflicts with ActiveSupport's Array#to_sentence
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

# Only active where explicitly used:
class ConfigParser
  using StringExtensions

  def parse(value)
    value.to_bool  # Works only here
  end
end

# Outside -- to_bool doesn't exist
"true".to_bool  # NoMethodError -- good! No pollution.

# Even better: use a value object
Boolean = Data.define(:value) do
  def self.parse(str)
    new(%w[true 1 yes].include?(str.to_s.downcase))
  end
end
```


## See Also

- [anti-monkey-patching](./anti-monkey-patching.md)
- [meta-eval-cautious](./meta-eval-cautious.md)
- [meta-delegate-forward](./meta-delegate-forward.md)
