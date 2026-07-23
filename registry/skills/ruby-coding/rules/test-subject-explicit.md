# test-subject-explicit

> Prefer explicit subject over implicit

## Why It Matters

Implicit subject (using subject without a name) makes tests harder to read since it's unclear what 'it' refers to. Explicitly name the subject or use a described method reference.

## Bad

```ruby
RSpec.describe User do
  subject { create(:user) }

  it { is_expected.to be_valid }  # What is 'it'?
  its(:name) { is_expected.to eq("Alice") }  # Obscure
end
```


## Good

```ruby
RSpec.describe User do
  let(:user) { create(:user) }

  it "is valid" do
    expect(user).to be_valid
  end

  it "has a name" do
    expect(user.name).to eq("Alice")
  end
end
```


## See Also

- [test-let-over-before](./test-let-over-before.md)
- [test-matcher-compose](./test-matcher-compose.md)
