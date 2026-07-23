# meta-hook-safe

> Use inherited/included/extended/prepended hooks carefully

## Why It Matters

Ruby's module/class hooks (`inherited`, `included`, `extended`, `prepended`, `method_added`, etc.) are powerful but can cause surprising side effects and ordering issues, especially when multiple modules chain hooks. Always call `super` to avoid breaking the hook chain.

Use `Module#prepend` for wrapping methods (AOP-style) and `Module#include` for adding methods. Document hooks that have side effects.


## Bad

```ruby
module Trackable
  def self.included(base)
    # Forgot super -- breaks chain if multiple modules use included hook
    base.extend(ClassMethods)
    base.has_many :audit_logs  # Side effect: adds ActiveRecord association
  end
end

class MyModel < ApplicationRecord
  include Trackable  # Surprise! Model now has audit_logs association
end
```


## Good

```ruby
module Trackable
  def self.included(base)
    super  # Preserve hook chain
    base.extend(ClassMethods)
  end

  module ClassMethods
    def track_changes
      has_many :audit_logs, as: :trackable
    end
  end
end

class MyModel < ApplicationRecord
  include Trackable
  track_changes  # Explicit opt-in -- clear and intentional
end
```


## See Also

- [meta-macro-module](./meta-macro-module.md)
- [meta-refinement-over-monkey](./meta-refinement-over-monkey.md)
- [obj-prefer-composition](./obj-prefer-composition.md)
