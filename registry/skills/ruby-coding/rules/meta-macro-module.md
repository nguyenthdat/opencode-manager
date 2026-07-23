# meta-macro-module

> Use Module#included for class macro methods

## Why It Matters

The `Module#included` hook allows a module to execute code when it's included into a class — commonly used to extend the class with `ClassMethods` and to set up class-level configuration (macros) like `has_many`, `validates`, or `before_action`.

Always call `super` in the `included` hook and keep the hook focused on class setup, not instance behavior.


## Bad

```ruby
module Searchable
  def search(query)
    where("name LIKE ?", "%#{query}%")  # SQL injection + mixed concerns
  end
end

class Product < ApplicationRecord
  extend Searchable  # search becomes a class method, but no setup hooks
end
```


## Good

```ruby
module Searchable
  def self.included(base)
    super
    base.extend(ClassMethods)
  end

  module ClassMethods
    def searchable_by(*fields)
      @search_fields = fields

      define_singleton_method(:search) do |query|
        conditions = @search_fields.map { |f| "#{f} LIKE :query" }.join(" OR ")
        where(conditions, query: "%#{sanitize_sql_like(query)}%")
      end
    end
  end
end

class Product < ApplicationRecord
  include Searchable
  searchable_by :name, :description, :sku
end

Product.search("widget")  # Clean, safe, declarative
```


## See Also

- [meta-hook-safe](./meta-hook-safe.md)
- [meta-define-method](./meta-define-method.md)
- [obj-module-method](./obj-module-method.md)
