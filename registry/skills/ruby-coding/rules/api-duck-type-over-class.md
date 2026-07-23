# api-duck-type-over-class

> Check respond_to? over is_a?/kind_of?

## Why It Matters

Ruby's strength is duck typing — if an object behaves like what you need, use it. Checking `is_a?` or `kind_of?` couples code to a specific class hierarchy and breaks with decorators, proxies, or test doubles. Check `respond_to?` for the specific methods you need.

## Bad

```ruby
def process(serializer)
  unless serializer.is_a?(JsonSerializer)
    raise ArgumentError, "Expected JsonSerializer"
  end
  serializer.serialize(data)
end  # Can't use decorator, test double, or any object that responds to :serialize
```

## Good

```ruby
def process(serializer)
  unless serializer.respond_to?(:serialize)
    raise ArgumentError, "serializer must respond to #serialize"
  end
  serializer.serialize(data)
end  # Works with any object that has #serialize
def send_notification(notifiable)
  raise ArgumentError unless notifiable.respond_to?(:email) && notifiable.respond_to?(:name)
  Mailer.notify(to: notifiable.email, name: notifiable.name)
end
```

## See Also

- [api-null-object](./api-null-object.md)
- [api-public-api-minimal](./api-public-api-minimal.md)
