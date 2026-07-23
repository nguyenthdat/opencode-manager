# sec-no-eval

> Never eval user input

## Why It Matters

eval, instance_eval, and class_eval execute arbitrary Ruby code. User-supplied strings to these methods give attackers full code execution (RCE). Use parsers, whitelisted dispatch, or case/when instead.

## Bad

```ruby
# User supplies: expression=User.destroy_all
result = eval(params[:expression])

# Dynamic method with user input -- dangerous!
"User".constantize.send(params[:action])
# Attacker sets action=destroy_all -- all users deleted
```


## Good

```ruby
# Use a safe expression evaluator:
require "dentaku"
calculator = Dentaku::Calculator.new
result = calculator.evaluate(params[:expression])

# Use a whitelist for dynamic dispatch:
ALLOWED_ACTIONS = %w[active inactive pending].freeze
raise ArgumentError unless ALLOWED_ACTIONS.include?(params[:status])
User.public_send(params[:status])
```


## See Also

- [sec-safe-deserialize](./sec-safe-deserialize.md)
- [sec-path-traversal](./sec-path-traversal.md)
- [meta-no-send-security](./meta-no-send-security.md)
