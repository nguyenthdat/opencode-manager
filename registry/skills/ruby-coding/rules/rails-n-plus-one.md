# rails-n-plus-one

> Use includes/eager_load/preload to prevent N+1

## Why It Matters

N+1 queries happen when iterating over a collection and accessing associations. Use includes (smart choice), eager_load (LEFT JOIN), or preload (separate query) based on your access pattern.

## Bad

```ruby
Post.all.each do |post|
  puts "#{post.title} by #{post.author.name}"
  post.comments.each { |c| puts c.body }
end
# Queries: 1 (posts) + N (authors) + N*M (comments)
```


## Good

```ruby
# Use includes for smart choice based on query plan:
posts = Post.includes(:author, :comments)
posts.each do |post|
  puts "#{post.title} by #{post.author.name}"
  post.comments.each { |c| puts c.body }
end
# Queries: 1 (posts) + 1 (authors) + 1 (comments) = 3 queries

# Or use strict_loading to raise on N+1:
posts = Post.strict_loading.includes(:author)
```


## See Also

- [perf-eager-load](./perf-eager-load.md)
- [rails-scopes-chainable](./rails-scopes-chainable.md)
