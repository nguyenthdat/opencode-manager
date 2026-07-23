# api-splat-args

> Use *args/**kwargs with care; prefer explicit params

## Why It Matters

Splat arguments (`*args`, `**kwargs`) hide the method's interface, making it harder to understand, document, and maintain. Use explicit parameters when the number of arguments is known. Reserve splats for delegation, forwarding, and truly dynamic interfaces.

## Bad

```ruby
def create_record(*args)  # What args does this accept?
  Record.new(*args).save
end
def render(**options)
  Template.render(template, **options)  # Silent about what options are valid
end
```

## Good

```ruby
def create_record(attributes = {})
  Record.new(attributes).save!
end
def render(template, layout: "application", status: 200, content_type: "text/html")
  Template.render(template, layout: layout, status: status, content_type: content_type)
end
# Splat only for delegation:
def delegate_call(object, method, *args, **kwargs, &block)
  object.public_send(method, *args, **kwargs, &block)
end
```

## See Also

- [api-keyword-arguments](./api-keyword-arguments.md)
- [api-default-values](./api-default-values.md)
