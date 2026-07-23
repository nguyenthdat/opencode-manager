# sec-sql-injection

> Use parameterized queries with ActiveRecord

## Why It Matters

String interpolation in SQL queries allows attackers to inject arbitrary SQL. ActiveRecord provides safe query methods with parameterized queries. Never interpolate user data into SQL strings. Use where, find_by, or sanitize_sql_like for LIKE queries.

## Bad

```ruby
# SQL Injection vulnerabilities:
User.where("name = '#{params[:name]}'")
# Attacker: name = "' OR '1'='1" -- returns all users

User.order(params[:sort_column])
# Attacker: sort_column = "id; DELETE FROM users; --"

User.connection.execute("SELECT * FROM users WHERE email = '#{email}'")
```


## Good

```ruby
# Parameterized queries -- safe:
User.where(name: params[:name])
User.where("name = ?", params[:name])
User.where("created_at > ?", 1.week.ago)

# LIKE queries -- sanitize the pattern:
User.where("name LIKE ?",
  "%#{ActiveRecord::Base.sanitize_sql_like(params[:q])}%")

# Safe ordering -- whitelist columns:
ALLOWED_SORT = %w[name email created_at].freeze
col = ALLOWED_SORT.include?(params[:sort]) ? params[:sort] : "created_at"
User.order(col)
```


## See Also

- [sec-xss-prevention](./sec-xss-prevention.md)
- [sec-mass-assignment](./sec-mass-assignment.md)
- [rails-scopes-chainable](./rails-scopes-chainable.md)
