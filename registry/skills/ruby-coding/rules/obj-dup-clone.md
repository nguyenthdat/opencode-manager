# obj-dup-clone

> Understand dup vs clone -- frozen state and singleton methods

## Why It Matters

Both `dup` and `clone` create shallow copies, but they differ: `clone` preserves the frozen state and singleton class methods of the original; `dup` does not. Use `clone` when you need the copy to carry the original's frozen status or singleton methods.

Both are shallow copies — for deep copies, implement a custom `deep_dup` or use `Marshal.load(Marshal.dump(obj))`.


## Bad

```ruby
original = "hello".freeze

copy = original.dup    # copy is NOT frozen -- can mutate unexpectedly
copy << " world"       # works, but original was meant to be immutable

obj = Object.new
def obj.greet; "hi"; end

copy2 = obj.dup         # singleton method `greet` is lost
copy2.greet             # NoMethodError!
```


## Good

```ruby
original = "hello".freeze

# clone preserves frozen state
safe_copy = original.clone
# safe_copy << " world"  # FrozenError -- expected

obj = Object.new
def obj.greet; "hi"; end

# clone preserves singleton methods
copy = obj.clone
copy.greet  # => "hi"

# For deep copies, use a dedicated method or serialization
deep = Marshal.load(Marshal.dump(complex_object))
```


## See Also

- [obj-freeze-constants](./obj-freeze-constants.md)
- [obj-immutable-value](./obj-immutable-value.md)
