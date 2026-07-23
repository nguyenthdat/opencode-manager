# sec-dependency-audit

> Run bundler-audit; keep gems updated

## Why It Matters

Known vulnerabilities in gem dependencies are a primary attack vector. bundler-audit checks your Gemfile.lock against the Ruby Advisory Database. Run it in CI and locally. Use bundle outdated regularly and review changelogs before upgrading.

## Bad

```ruby
# Gemfile with unmaintained gems, no version constraints:
gem "rails"
gem "nokogiri"  # No version -- could pull vulnerable version
gem "devise"    # No version pin
# No bundler-audit in CI pipeline
```


## Good

```ruby
# Gemfile -- pin with pessimistic operator for patches:
gem "rails", "~> 7.2.0"
gem "nokogiri", "~> 1.16.0"
gem "devise", "~> 4.9.0"

# CI pipeline:
- name: Security audit
  run: |
    gem install bundler-audit
    bundle-audit check --update

# Rake task:
namespace :security do
  desc "Check for vulnerable gems"
  task :audit do
    sh "bundle-audit check --update"
  end
end
```


## See Also

- [proj-gemfile-pin](./proj-gemfile-pin.md)
- [lint-brakeman-security](./lint-brakeman-security.md)
