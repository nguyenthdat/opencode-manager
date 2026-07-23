# anti-eval-execution

> Don't eval/class_eval with user input

## Why It Matters

eval, instance_eval, and class_eval with user-supplied strings give attackers arbitrary code execution. Use parsers, whitelists, or dispatch tables instead.

## Bad

```ruby
result = eval(params[:expression])
# Attacker sends: `User.destroy_all` -- all users deleted!

module_name = params[:module]
mod = module_name.constantize  # Attacker sends: `Kernel`
mod.instance_eval(params[:code])  # Arbitrary code execution
```


## Good

```ruby
# Use a safe expression evaluator:
require "dentaku"
calculator = Dentaku::Calculator.new
result = calculator.evaluate(params[:expression])

# Use a whitelist:
ALLOWED_MODULES = %w[Reports Analytics].freeze
mod_name = params[:module]
unless ALLOWED_MODULES.include?(mod_name)
  raise ArgumentError, "Invalid module: #{mod_name}"
end
mod = mod_name.constantize
```


## See Also

- [sec-no-eval](./sec-no-eval.md)
- [meta-eval-cautious](./meta-eval-cautious.md)
