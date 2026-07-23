# rails-partial-render

> Use partials with locals; avoid instance variable coupling

## Why It Matters

Partials that reference instance variables are coupled to their controller -- you can't reuse them with different data. Pass data via locals to make partials explicit and reusable.

## Bad

```erb
<!-- app/views/orders/_item.html.erb -->
<tr>
  <td><%= @product.name %></td>   <!-- Coupled to @product -->
  <td><%= item.quantity %></td>
</tr>
```


## Good

```erb
<!-- app/views/orders/_item.html.erb -->
<tr>
  <td><%= product.name %></td>    <!-- Passed locally -->
  <td><%= quantity %></td>
</tr>

<!-- Usage: -->
<%= render partial: "item", collection: @order.items,
    as: :item, locals: { product: item.product } %>
```


## See Also

- [rails-skinny-controller](./rails-skinny-controller.md)
