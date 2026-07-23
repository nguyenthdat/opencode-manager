# test-focus-danger

> Never commit fit/fdescribe/fcontext to main

## Why It Matters

RSpec's focused examples (fit, fdescribe, fcontext) only run the focused test -- and skip all others. Committing focused tests to CI means only one test runs. Use RuboCop RSpec's RSpec/Focus cop to catch them.

## Bad

```ruby
fdescribe "Order processing" do  # Committed to main!
  it "does something" do; end
end
# Every other test file is silently skipped in CI
```


## Good

```ruby
RSpec.describe "Order processing" do
  it "does something" do; end
end

# Use :focus tag temporarily in development:
RSpec.describe "Order processing", :focus do
  it "does something" do; end
end
# Configure RuboCop to catch focus:
# RSpec/Focus:
#   Enabled: true
```


## See Also

- [test-describe-context](./test-describe-context.md)
- [lint-rubocop-standard](./lint-rubocop-standard.md)
