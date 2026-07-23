# block-flat-map

> Use .flat_map over .map.flatten

## Why It Matters

`.flat_map` (alias `.flat_collect`) maps each element to a collection and flattens the result by one level in a single pass. `.map.flatten` creates an intermediate array and then flattens it — two allocations instead of one.

`.flat_map` flattens exactly one level. Use `.flatten(n)` on the result only if you need deeper flattening.


## Bad

```ruby
# Two allocations: intermediate array, then flattened
tags = articles.map { |article| article.tags }.flatten

# Even worse -- map, flatten, then uniq
unique_tags = articles.map { |article| article.tags }.flatten.uniq

words = sentences.map { |s| s.split }.flatten
```


## Good

```ruby
tags = articles.flat_map(&:tags)
unique_tags = articles.flat_map(&:tags).uniq

words = sentences.flat_map { |sentence| sentence.split }

# Combine with filter:
comment_authors = posts.flat_map { |post| post.comments.map(&:author) if post.has_comments? }
# Safer with compact:
comment_authors = posts.flat_map { |post| post.comments.map(&:author) if post.has_comments? }.compact
```


## See Also

- [block-map-over-each](./block-map-over-each.md)
- [block-select-reject](./block-select-reject.md)
