# sec-cookie-secure

> Set secure, httponly, samesite on cookies

## Why It Matters

Cookies without security flags are vulnerable to theft via MITM (missing secure), XSS (missing httponly), and CSRF (missing samesite). Always set all three flags on sensitive cookies, especially session cookies.

## Bad

```ruby
# Insecure cookie settings:
Rails.application.config.session_store :cookie_store,
  key: "_app_session"

cookies[:remember_token] = {
  value: token,
  expires: 1.year.from_now
  # Missing: secure, httponly, samesite
}
```


## Good

```ruby
# Secure session configuration:
Rails.application.config.session_store :cookie_store,
  key: "_app_session",
  secure: Rails.env.production?,
  httponly: true,
  same_site: :lax,
  expire_after: 24.hours

# Secure custom cookies:
cookies.encrypted[:remember_token] = {
  value: token,
  expires: 1.year.from_now,
  secure: true,
  httponly: true,
  same_site: :strict
}
```


## See Also

- [sec-csrf-protection](./sec-csrf-protection.md)
- [sec-secrets-management](./sec-secrets-management.md)
