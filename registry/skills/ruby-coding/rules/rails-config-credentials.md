# rails-config-credentials

> Use Rails credentials over .env files

## Why It Matters

Rails credentials store secrets encrypted at rest (config/credentials.yml.enc). .env files are plain-text and easily leaked. Use environment-specific credentials for staging/production separation.

## Bad

# .env file -- plain text, easily committed accidentally
STRIPE_SECRET_KEY=sk_live_abc123
AWS_ACCESS_KEY_ID=AKIA123
```


## Good

```ruby
# Edit with: rails credentials:edit
# config/credentials.yml.enc (encrypted)
stripe:
  secret_key: sk_live_abc123
aws:
  access_key_id: AKIA123

# Access in code:
Stripe.api_key = Rails.application.credentials.stripe[:secret_key]

# Environment-specific:
# rails credentials:edit --environment production
Stripe.api_key = Rails.application.credentials.dig(:stripe, :secret_key)
```


## See Also

- [sec-secrets-management](./sec-secrets-management.md)
- [proj-dotenv-management](./proj-dotenv-management.md)
