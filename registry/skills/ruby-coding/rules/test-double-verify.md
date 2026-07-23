# test-double-verify

> Use verifying doubles (instance_double) over generic

## Why It Matters

Verifying doubles (instance_double, class_double) check that mocked methods exist on the real class at test time. Generic doubles (double) accept any method call, hiding typos and method rename bugs.

## Bad

```ruby
mailer = double("Mailer")
allow(mailer).to receive(:deliver).and_return(true)
# No check that Mailer#deliver actually exists!
allow(mailer).to receive(:delivar).and_return(true)  # Typo -- silently passes
```


## Good

```ruby
mailer = instance_double(Mailer)
allow(mailer).to receive(:deliver).and_return(true)
# If Mailer doesn't have #deliver, test fails with clear message

# Or for class methods:
notifier = class_double(Notifier)
allow(notifier).to receive(:broadcast).and_return(true)
# Verifies Notifier.broadcast exists
```


## See Also

- [test-shared-examples](./test-shared-examples.md)
- [test-matcher-compose](./test-matcher-compose.md)
