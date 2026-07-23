# test-rspec-framework

> Use RSpec for behavior-driven testing

## Why It Matters

RSpec is the de facto Ruby testing framework. Its describe/context/it DSL makes test intent clear and produces readable output. Minitest is fine for gems; RSpec is preferred for Rails applications.

## Bad

```ruby
# Minitest style -- less expressive
def test_user_is_active
  user = User.new(active: true)
  assert user.active?
end
```


## Good

```ruby
# RSpec style -- self-documenting
RSpec.describe User do
  describe "#active?" do
    it "returns true when the user is active" do
      user = User.new(active: true)
      expect(user.active?).to be true
    end
  end
end
```


## See Also

- [test-describe-context](./test-describe-context.md)
- [test-let-over-before](./test-let-over-before.md)
