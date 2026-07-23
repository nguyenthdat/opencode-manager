# meta-no-send-security

> Don't use send with user-supplied method names

## Why It Matters

`send` with user-supplied data allows callers to invoke arbitrary methods, including `destroy`, `delete`, `exit!`, or methods that modify sensitive data. Always validate or whitelist method names from external sources.

Use a whitelist of allowed method names, or better, use explicit dispatch with `case`/`when` or a Hash mapping.


## Bad

```ruby
class AdminController < ApplicationController
  def bulk_action
    action = params[:action_name]  # User-supplied!
    User.all.each { |user| user.send(action) }
    # Attacker sends action_name=destroy -- all users deleted!
  end
end
```


## Good

```ruby
class AdminController < ApplicationController
  ALLOWED_ACTIONS = %w[send_welcome_email flag_as_verified deactivate].freeze

  def bulk_action
    action = params[:action_name]
    unless ALLOWED_ACTIONS.include?(action)
      raise ArgumentError, "Invalid bulk action: #{action}"
    end

    User.all.each { |user| user.public_send(action) }
  end

  # Even better: explicit dispatch
  def bulk_action
    case params[:action_name]
    when "send_welcome_email" then User.all.each(&:send_welcome_email)
    when "flag_as_verified"  then User.all.each(&:flag_as_verified!)
    when "deactivate"        then User.all.each(&:deactivate!)
    else render json: { error: "Unknown action" }, status: :unprocessable_entity
    end
  end
end
```


## See Also

- [meta-send-cautious](./meta-send-cautious.md)
- [sec-no-eval](./sec-no-eval.md)
- [sec-mass-assignment](./sec-mass-assignment.md)
