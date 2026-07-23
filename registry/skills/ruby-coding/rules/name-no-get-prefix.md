# name-no-get-prefix

> Don't prefix getters with get_

## Why It Matters

Ruby convention omits get_ from accessor methods. A getter is simply the attribute name. Only use get_ when the retrieval has side effects or is non-trivial.

## Bad

```ruby
def get_name; @name; end
def get_age; @age; end
user.get_name
```


## Good

```ruby
def name; @name; end
def age; @age; end
user.name
# get_ only when retrieval is non-trivial:
def get_config_value(key)
  fetch_from_cache(key) || load_from_db(key)
end
```


## See Also

- [name-methods-snake-case](./name-methods-snake-case.md)
- [obj-attr-accessor-auto](./obj-attr-accessor-auto.md)
