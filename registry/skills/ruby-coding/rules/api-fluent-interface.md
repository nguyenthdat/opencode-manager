# api-fluent-interface

> Return self for method chaining when mutating

## Why It Matters

Returning `self` from mutating methods enables method chaining, which creates readable, pipeline-style code. This is used extensively in ActiveRecord (`where.order.limit`), builders, and configuration APIs. Only return `self` when the method mutates.

## Bad

```ruby
class Query
  def select(fields); @select = fields; nil; end  # Breaks chaining!
  def where(conditions); @where = conditions; nil; end
  def execute; end
end
query = Query.new
query.select("name, email")
query.where("active = true")
query.execute  # Must call each method separately
```

## Good

```ruby
class Query
  def select(fields); @select = fields; self; end
  def where(conditions); @where = conditions; self; end
  def order(clause); @order = clause; self; end
  def limit(n); @limit = n; self; end
  def execute; end
end
Query.new
  .select("name, email")
  .where("active = true")
  .order("created_at DESC")
  .limit(10)
  .execute
```

## See Also

- [api-builder-pattern](./api-builder-pattern.md)
- [api-factory-methods](./api-factory-methods.md)
- [block-tap-yield](./block-tap-yield.md)
