# anti-control-couple

> Don't pass booleans to control flow inside methods

## Why It Matters

Boolean control arguments split method behavior into two paths, violating SRP. Create two separate methods with descriptive names instead.

## Bad

```ruby
def send_notification(user, async: false)
  if async
    NotificationJob.perform_later(user.id)
  else
    mailer = NotificationMailer.with(user: user)
    mailer.notify.deliver_now
  end
end
# Caller: send_notification(user, async: true)  -- What does async mean?
```


## Good

```ruby
def send_notification(user)
  mailer = NotificationMailer.with(user: user)
  mailer.notify.deliver_now
end

def send_notification_async(user)
  NotificationJob.perform_later(user.id)
end
# Now names describe exactly what happens
```


## See Also

- [api-single-responsibility](./api-single-responsibility.md)
