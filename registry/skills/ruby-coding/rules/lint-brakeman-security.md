# lint-brakeman-security

> Run Brakeman for security analysis

## Why It Matters

Brakeman is a static analysis security scanner for Rails apps. It catches SQL injection, XSS, mass assignment, and other vulnerabilities without running the app. Run it in CI.

## Bad

# No security scanning in CI -- vulnerabilities reach production
```


## Good

```yaml
# CI pipeline:
- name: Brakeman security scan
  run: |
    gem install brakeman
    brakeman --no-pager --summary

# Rake task:
namespace :security do
  desc "Run Brakeman security scan"
  task :brakeman do
    sh "brakeman --no-pager"
  end
end
```


## See Also

- [sec-dependency-audit](./sec-dependency-audit.md)
- [lint-rubocop-standard](./lint-rubocop-standard.md)
