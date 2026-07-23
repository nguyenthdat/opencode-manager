# test-shared-examples

> Use shared_examples and it_behaves_like for reuse

## Why It Matters

shared_examples DRY up test code when multiple classes share behavior. Use it_behaves_like to include shared tests with context. Shared examples should be focused on a single behavior.

## Bad

```ruby
RSpec.describe Post do
  it "is findable by slug" do
    post = create(:post, title: "Hello")
    expect(Post.find_by_slug("hello")).to eq(post)
  end
end
RSpec.describe Product do
  it "is findable by slug" do
    product = create(:product, name: "Widget")
    expect(Product.find_by_slug("widget")).to eq(product)
  end
end
```


## Good

```ruby
RSpec.shared_examples "slug findable" do |factory:, field:, value:|
  it "is findable by slug" do
    record = create(factory, field => value)
    expect(described_class.find_by_slug(value.parameterize)).to eq(record)
  end
end

RSpec.describe Post do
  it_behaves_like "slug findable", factory: :post, field: :title, value: "Hello"
end

RSpec.describe Product do
  it_behaves_like "slug findable", factory: :product, field: :name, value: "Widget"
end
```


## See Also

- [test-let-over-before](./test-let-over-before.md)
- [test-one-expectation](./test-one-expectation.md)
