# lint-fasterer-speed

> Run Fasterer for performance linting

## Why It Matters

Fasterer is a static analysis tool that suggests performance improvements: using map over each, select over map+grep, reverse_each over reverse.each, and more.

## Bad

# No performance linting -- slow patterns accumulate unnoticed
```


## Good

```yaml
# CI pipeline:
- name: Performance lint
  run: |
    gem install fasterer
    fasterer

# .fasterer.yml
speedups:
  each_with_index_vs_while: true
  for_loop_vs_each: true
  reverse_each_vs_reverse_each: true
```


## See Also

- [lint-rubocop-standard](./lint-rubocop-standard.md)
- [lint-brakeman-security](./lint-brakeman-security.md)
