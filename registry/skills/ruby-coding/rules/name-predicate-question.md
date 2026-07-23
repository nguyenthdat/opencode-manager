# name-predicate-question

> End predicate methods with ?

## Why It Matters

Methods that return a boolean should end with ?. This makes code read naturally and allows chaining with other predicate methods.

## Bad

```ruby
def admin; @role == :admin; end
def loggedin; @session.present?; end
if user.admin  # Reads oddly
```


## Good

```ruby
def admin?; @role == :admin; end
def logged_in?; @session.present?; end
if user.admin?  # Reads naturally: 'if user is admin?'
```


## See Also

- [name-is-has-boolean](./name-is-has-boolean.md)
- [api-predicate-methods](./api-predicate-methods.md)
