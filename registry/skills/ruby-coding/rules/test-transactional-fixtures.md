# test-transactional-fixtures

> Use transactional fixtures or database_cleaner

## Why It Matters

Transactional fixtures wrap each test in a database transaction that rolls back after the test, keeping the database clean and tests isolated. For non-transactional features (JavaScript system tests), use database_cleaner.

## Bad

```ruby
RSpec.describe Order do
  it "counts orders" do
    create(:order)  # Pollutes DB for next test
    expect(Order.count).to eq(1)
  end

  it "counts orders again" do
    # Fails because previous test's order still exists!
    expect(Order.count).to eq(0)
  end
end
```


## Good

```ruby
# spec/rails_helper.rb -- enabled by default:
RSpec.configure do |config|
  config.use_transactional_fixtures = true
end

# For system tests with JavaScript:
RSpec.configure do |config|
  config.before(:each, type: :system) do
    driven_by :selenium, using: :headless_chrome
    DatabaseCleaner.strategy = :truncation
    DatabaseCleaner.clean
  end
end
```


## See Also

- [test-request-specs](./test-request-specs.md)
- [test-factory-bot](./test-factory-bot.md)
