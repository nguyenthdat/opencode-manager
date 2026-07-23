# api-builder-pattern

> Use Builder pattern for multi-step object construction

## Why It Matters

When an object has many optional parameters, complex validation, or multi-step construction, the Builder pattern separates construction from representation. Builders provide named methods for each option and validate at `.build` time.

## Bad

```ruby
email = Email.new(
  "alice@example.com", "bob@example.com", "Meeting Reminder",
  "Don't forget", nil, nil, :high, true, nil, nil, nil, nil
)  # Telescoping constructor -- unreadable
```

## Good

```ruby
class EmailBuilder
  def initialize; @to = []; @priority = :normal; end
  def to(address, name: nil); @to << { address: address, name: name }; self; end
  def from(address); @from = address; self; end
  def subject(text); @subject = text; self; end
  def body(text); @body = text; self; end
  def priority(level); @priority = level; self; end
  def build
    raise ArgumentError, "from is required" unless @from
    Email.new(from: @from, to: @to, subject: @subject, body: @body, priority: @priority)
  end
end
EmailBuilder.new.from("alerts@ex.com").to("bob@ex.com").subject("Hi").body("Hello").build
```

## See Also

- [api-fluent-interface](./api-fluent-interface.md)
- [api-factory-methods](./api-factory-methods.md)
- [api-default-values](./api-default-values.md)
