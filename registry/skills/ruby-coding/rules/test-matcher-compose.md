# test-matcher-compose

> Use built-in matchers over manual assertions

## Why It Matters

RSpec's built-in matchers (include, match, change, have_attributes) produce better failure messages and are more expressive than manual boolean assertions.

## Bad

```ruby
it "has correct attributes" do
  user = create(:user)
  expect(user.name == "Alice").to be true       # Poor failure message
  expect(user.email).to eq("alice@example.com")  # OK but verbose
end
```


## Good

```ruby
it "has correct attributes" do
  user = create(:user)
  expect(user).to have_attributes(
    name: "Alice",
    email: "alice@example.com"
  )
end

it "sends notification" do
  expect { order.submit! }
    .to change { ActionMailer::Base.deliveries.count }.by(1)
end
```


## See Also

- [test-rspec-framework](./test-rspec-framework.md)
- [test-one-expectation](./test-one-expectation.md)
