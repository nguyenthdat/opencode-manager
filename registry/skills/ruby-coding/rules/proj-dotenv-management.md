# proj-dotenv-management

> Use dotenv for development only, not production

## Why It Matters

dotenv is for local development convenience. In production, use Rails credentials, environment variables, or a secret manager. Loading .env in production is an anti-pattern.

## Bad

```ruby
# Gemfile:
gem "dotenv-rails"  # Not scoped -- loads in production!
```


## Good

```ruby
# Gemfile:
group :development, :test do
  gem "dotenv-rails"
end

# Production: use Rails credentials or env vars
# Heroku: heroku config:set STRIPE_KEY=sk_live_...
# Docker: environment: section in docker-compose.yml
```


## See Also

- [rails-config-credentials](./rails-config-credentials.md)
- [sec-secrets-management](./sec-secrets-management.md)
