# name-is-has-boolean

> Prefix booleans with is_/has_/can_

## Why It Matters

Boolean methods and variables benefit from is_, has_, or can_ prefixes that make their boolean nature clear. Combined with ? suffix, this produces highly readable code.

## Bad

```ruby
def active; @status == :active; end
def items; @items.any?; end
def receive_notifications; @prefs[:notifications]; end
```


## Good

```ruby
def active?; @status == :active; end
def has_items?; @items.any?; end
def receives_notifications?; @prefs[:notifications]; end
```


## See Also

- [name-predicate-question](./name-predicate-question.md)
- [api-predicate-methods](./api-predicate-methods.md)
