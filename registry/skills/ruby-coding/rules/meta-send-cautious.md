# meta-send-cautious

> Use public_send unless you need private access

## Why It Matters

`send` invokes any method regardless of visibility (public, protected, private). `public_send` only invokes public methods. Using `send` unnecessarily exposes private internals and makes it harder to reason about what's part of the public API.

Use `public_send` as the default, and reserve `send` for cases where you explicitly need to call private methods.


## Bad

```ruby
class Reporter
  def generate_report(type, data)
    send("generate_#{type}_report", data)  # Could call private methods
  end

  private

  def generate_secret_report(data)
    # Sensitive logic that should not be callable externally
  end
end

# Dynamic dispatch with user input -- dangerous
user.send(params[:action])  # User could call :destroy!, :delete!, etc.
```


## Good

```ruby
class Reporter
  VALID_TYPES = %w[sales inventory users].freeze

  def generate_report(type, data)
    raise ArgumentError, "Unknown report type: #{type}" unless VALID_TYPES.include?(type.to_s)
    public_send("generate_#{type}_report", data)
  end

  private

  def generate_internal_audit(data)
    # Not accessible via public_send
  end
end
```


## See Also

- [meta-no-send-security](./meta-no-send-security.md)
- [sec-no-eval](./sec-no-eval.md)
