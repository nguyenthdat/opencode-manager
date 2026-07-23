# obj-single-responsibility

> Each class has one reason to change

## Why It Matters

The Single Responsibility Principle (SRP) states a class should have exactly one job. When a class handles multiple concerns, changes to one concern risk breaking another.

Split multi-concern classes into smaller, focused classes each responsible for a single piece of the domain.


## Bad

```ruby
class User
  attr_accessor :name, :email

  def save_to_database
    # persistence logic
  end

  def send_welcome_email
    # email logic -- loading templates, SMTP config
  end

  def generate_report
    # PDF generation logic
  end

  def validate
    # validation logic
  end
end
```


## Good

```ruby
class User
  attr_accessor :name, :email

  def valid?
    UserValidator.new(self).valid?
  end
end

class UserRepository
  def save(user)
    # persistence logic
  end
end

class WelcomeEmailSender
  def send_to(user)
    # email logic
  end
end

class UserReportGenerator
  def generate(user)
    # PDF generation logic
  end
end
```


## See Also

- [obj-prefer-composition](./obj-prefer-composition.md)
- [api-single-responsibility](./api-single-responsibility.md)
