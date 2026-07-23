# doc-no-stale-code

> Remove commented-out code; trust git history

## Why It Matters

Commented-out code rots: it's never tested, becomes outdated, and clutters the file. Git history preserves old versions. If you need to reference old code, add a comment pointing to the commit hash.

## Bad

```ruby
def process(data)
  # Old approach:
  # result = LegacyProcessor.run(data)
  # return result if result.success?

  # Even older approach:
  # data = transform(data) if needs_transform?(data)

  NewProcessor.call(data)
end
```


## Good

```ruby
def process(data)
  # Replaced LegacyProcessor in commit abc1234
  NewProcessor.call(data)
end
```


## See Also

- [doc-inline-why](./doc-inline-why.md)
