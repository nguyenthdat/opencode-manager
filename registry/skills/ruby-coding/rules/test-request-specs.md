# test-request-specs

> Use request specs over controller specs

## Why It Matters

Request specs test the full HTTP stack (middleware, routing, parameters, response) and are the Rails-recommended approach since Rails 5. Controller specs bypass routing and middleware, giving false confidence.

## Bad

```ruby
# spec/controllers/orders_controller_spec.rb
RSpec.describe OrdersController, type: :controller do
  it "creates an order" do
    post :create, params: { order: { amount: 100 } }
    expect(response).to redirect_to(Order.last)
  end
end
```


## Good

```ruby
# spec/requests/orders_spec.rb
RSpec.describe "Orders", type: :request do
  it "creates an order" do
    post "/orders", params: { order: { amount: 100 } }

    expect(response).to have_http_status(:redirect)
    expect(response).to redirect_to(order_path(Order.last))
    follow_redirect!
    expect(response.body).to include("Order created")
  end
end
```


## See Also

- [test-rspec-framework](./test-rspec-framework.md)
- [test-transactional-fixtures](./test-transactional-fixtures.md)
