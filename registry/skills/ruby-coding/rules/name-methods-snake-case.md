# name-methods-snake-case

> snake_case for methods and variables

## Why It Matters

Ruby convention uses snake_case for method and local variable names. Creates clear visual distinction from PascalCase classes and SCREAMING_SNAKE_CASE constants.

## Bad

```ruby
def CreateUser; end
def getData; end
myVariable = 42
```


## Good

```ruby
def create_user; end
def get_data; end
my_variable = 42
```


## See Also

- [name-classes-pascal-case](./name-classes-pascal-case.md)
- [name-constants-upper-snake](./name-constants-upper-snake.md)
