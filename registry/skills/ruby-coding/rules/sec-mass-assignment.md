# sec-mass-assignment

> Use strong parameters in Rails

## Why It Matters

Mass assignment without whitelisting allows attackers to set sensitive fields (e.g., admin: true, account_balance: 999999). Rails strong parameters require explicit whitelisting. Always use require + permit in controllers. Never pass params directly to create, update, or new.

## Bad

```ruby
class UsersController < ApplicationController
  def create
    User.create(params)  # Attacker can set admin=true
  end

  def update
    @user.update(params[:user])  # Attacker can set any column
  end

  def register
    User.create(params.permit!)  # permit! whitelists everything
  end
end
```


## Good

```ruby
class UsersController < ApplicationController
  def create
    user = User.create(user_params)
    render json: user, status: :created
  end

  private

  def user_params
    params.require(:user).permit(
      :name, :email, :password, :password_confirmation
    )
  end

  # For admin-only fields, use separate method:
  def admin_user_params
    params.require(:user).permit(
      :name, :email, :role, :active, :password
    )
  end
end
```


## See Also

- [sec-sql-injection](./sec-sql-injection.md)
- [sec-csrf-protection](./sec-csrf-protection.md)
- [rails-strong-params](./rails-strong-params.md)
