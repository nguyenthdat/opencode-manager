# perf-eager-load

> Eager load associations to avoid N+1 queries

## Why It Matters

ActiveRecord lazy-loads associations by default, causing N+1 queries (1 for the collection + N for each record's association). Use includes, eager_load, or preload to load associations in advance.

## Bad

```ruby
# N+1 query:
posts = Post.where(published: true)
posts.each do |post|
  puts post.author.name  # Queries author for EACH post
end
# SQL: SELECT * FROM posts;
# SQL: SELECT * FROM users WHERE id = 1;
# SQL: SELECT * FROM users WHERE id = 2;
# SQL: SELECT * FROM users WHERE id = 3; ...
```


## Good

```ruby
# Single query or two queries:
posts = Post.where(published: true).includes(:author)
posts.each do |post|
  puts post.author.name  # Already loaded -- no extra queries
end
# SQL: SELECT * FROM posts;
# SQL: SELECT * FROM users WHERE id IN (1, 2, 3, ...);
```


## See Also

- [rails-n-plus-one](./rails-n-plus-one.md)
- [perf-avoid-object-alloc](./perf-avoid-object-alloc.md)
