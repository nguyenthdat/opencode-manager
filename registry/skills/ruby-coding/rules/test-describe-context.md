# test-describe-context

> Use describe/context/it with readable descriptions

## Why It Matters

RSpec's describe (what), context (when/situation), and it (expected behavior) structure creates readable spec output. Descriptions should form grammatical sentences when combined.

## Bad

```ruby
RSpec.describe Order do
  it "works" do
    order = Order.new(status: "paid")
    expect(order.paid?).to eq(true)
  end
end
```


## Good

```ruby
RSpec.describe Order do
  describe "#paid?" do
    context "when payment status is paid" do
      it "returns true" do
        order = Order.new(payment_status: "paid")
        expect(order.paid?).to be true
      end
    end

    context "when payment status is pending" do
      it "returns false" do
        order = Order.new(payment_status: "pending")
        expect(order.paid?).to be false
      end
    end
  end
end
```


## See Also

- [test-rspec-framework](./test-rspec-framework.md)
- [test-one-expectation](./test-one-expectation.md)
