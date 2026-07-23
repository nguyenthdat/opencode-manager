# rails-scopes-chainable

> Write chainable scopes with lambdas

## Why It Matters

Scopes should be chainable -- always returning an ActiveRecord::Relation. Use lambdas to ensure conditions are evaluated lazily. Avoid class methods that return arrays.

## Bad

```ruby
class Post < ApplicationRecord
  scope :published, where(published: true)  # Eager evaluation -- breaks with time
  scope :popular, -> { select("*, COUNT(comments.id)").joins(:comments) }  # No chain
end
```


## Good

```ruby
class Post < ApplicationRecord
  scope :published, -> { where(published: true) }
  scope :recent, -> { where("created_at > ?", 1.week.ago) }
  scope :with_author, -> { includes(:author) }

  # Chainable -- returns relation, can be combined:
  # Post.published.recent.with_author
end
```


## See Also

- [rails-fat-model](./rails-fat-model.md)
- [rails-n-plus-one](./rails-n-plus-one.md)
