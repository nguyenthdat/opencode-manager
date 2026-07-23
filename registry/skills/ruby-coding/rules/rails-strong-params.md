# rails-strong-params

> Use strong parameters, never direct mass assignment

## Why It Matters

Rails strong parameters require explicit whitelisting of allowed attributes. Direct mass assignment allows attackers to set any column. Always use require + permit in controllers.

## Bad

```ruby
def update
  @user.update(params[:user])  # Attacker can set admin=true
end
def create
  User.create(params.permit!)  # permit! whitelists everything
end
```


## Good

```ruby
def update
  if @user.update(user_params)
    redirect_to @user
  else
    render :edit
  end
end

private

def user_params
  params.require(:user).permit(:name, :email, :password, :bio)
end

# For nested attributes:
def order_params
  params.require(:order).permit(
    :customer_id,
    items_attributes: [:id, :product_id, :quantity, :_destroy]
  )
end
```


## See Also

- [sec-mass-assignment](./sec-mass-assignment.md)
- [sec-sql-injection](./sec-sql-injection.md)
