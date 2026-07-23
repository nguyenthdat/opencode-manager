# doc-deprecated-warning

> Use @deprecated with migration path

## Why It Matters

When deprecating a method, use the YARD @deprecated tag with the version and migration path. Add a runtime deprecation warning so users see the warning in logs.

## Bad

```ruby
# Delete this silently -- breaks users with no warning
def old_method
  new_method
end
```


## Good

```ruby
# @deprecated Use {#new_method} instead. Will be removed in v3.0.
def old_method
  ActiveSupport::Deprecation.warn(
    "old_method is deprecated, use new_method instead"
  )
  new_method
end
```


## See Also

- [doc-yard-format](./doc-yard-format.md)
- [api-public-api-minimal](./api-public-api-minimal.md)
