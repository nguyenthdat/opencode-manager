# sec-secrets-management

> Use Rails credentials or env vars for secrets

## Why It Matters

Hardcoding secrets (API keys, passwords, tokens) in source code exposes them to anyone with repository access and makes rotation impossible. Rails credentials encrypt secrets at rest. Environment variables are acceptable for deployment. Never commit .env files or master.key.

## Bad

```ruby
# Hardcoded in source:
Stripe.api_key = "sk_live_abc123"
AWS_ACCESS_KEY = "EXAMPLE_AWS_ACCESS_KEY"

# In config file committed to git:
# config/initializers/stripe.rb
Stripe.api_key = "sk_live_xyz789"
```


## Good

```ruby
# Rails credentials (recommended):
Stripe.api_key = Rails.application.credentials.stripe[:secret_key]
Stripe.publishable_key =
  Rails.application.credentials.stripe[:publishable_key]

# Environment variables (12-factor alternative):
Stripe.api_key = ENV.fetch("STRIPE_SECRET_KEY")

# Never access secrets from models directly -- inject via config:
class PaymentService
  def initialize(api_key: Rails.application.credentials.stripe[:secret_key])
    @api_key = api_key
  end
end
```


## See Also

- [rails-config-credentials](./rails-config-credentials.md)
- [proj-dotenv-management](./proj-dotenv-management.md)
