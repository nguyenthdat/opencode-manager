# test-factory-bot

> Use FactoryBot over fixtures for test data

## Why It Matters

FactoryBot creates test data with sensible defaults and explicit overrides. Fixtures (YAML files) are brittle -- changes cascade across tests, and data is disconnected from test logic.

## Bad

```ruby
# fixtures/users.yml
# alice:
#   name: Alice
#   email: alice@example.com
#   admin: false

def test_admin
  user = users(:alice)  # Where does :alice come from?
  assert_not user.admin?
end
```


## Good

```ruby
# spec/factories/users.rb
FactoryBot.define do
  factory :user do
    name { "Alice" }
    email { "alice@example.com" }
    admin { false }

    trait :admin do
      admin { true }
    end
  end
end

it "is not admin by default" do
  user = create(:user)
  expect(user.admin?).to be false
end

it "can be an admin" do
  admin = create(:user, :admin)
  expect(admin.admin?).to be true
end
```


## See Also

- [test-let-over-before](./test-let-over-before.md)
- [test-double-verify](./test-double-verify.md)
