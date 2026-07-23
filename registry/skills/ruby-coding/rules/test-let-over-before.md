# test-let-over-before

> Use let for test data, not instance variables in before

## Why It Matters

let is lazily evaluated (only when referenced), memoized within each example, and creates descriptive variable names. Instance variables set in before blocks are always evaluated and prone to nil errors from typos.

## Bad

```ruby
RSpec.describe Order do
  before do
    @user = create(:user)
    @product = create(:product)
  end

  it "links to user" do
    expect(@order.user).to eq(@user)  # @order? where did that come from?
  end
end
```


## Good

```ruby
RSpec.describe Order do
  let(:user) { create(:user) }
  let(:product) { create(:product) }
  let(:order) { create(:order, user: user, product: product) }

  it "links to user" do
    expect(order.user).to eq(user)
  end
end
```


## See Also

- [test-subject-explicit](./test-subject-explicit.md)
- [test-shared-examples](./test-shared-examples.md)
