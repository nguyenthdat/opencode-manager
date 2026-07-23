# proj-rubocop-configure

> Set up RuboCop with a shared config

## Why It Matters

A shared RuboCop configuration ensures consistent code style across the team. Use .rubocop.yml for project config and inherit from a company-wide gem for shared rules.

## Bad

# No .rubocop.yml -- everyone uses defaults, style drifts
```


## Good

```yaml
# .rubocop.yml
inherit_gem:
  my_company_style: config/rubocop.yml

AllCops:
  TargetRubyVersion: 3.3
  NewCops: enable
  Exclude:
    - "db/schema.rb"
    - "bin/**/*"
    - "vendor/**/*"

Metrics/MethodLength:
  Max: 15

Style/FrozenStringLiteralComment:
  Enabled: true
```


## See Also

- [lint-rubocop-standard](./lint-rubocop-standard.md)
- [lint-frozen-string-literal](./lint-frozen-string-literal.md)
