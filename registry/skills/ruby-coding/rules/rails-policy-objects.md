# rails-policy-objects

> Extract authorization to policy objects (Pundit/CanCanCan)

## Why It Matters

Authorization logic mixed into controllers or models is scattered, hard to audit, and error-prone. Pundit provides a consistent policy-per-model pattern that centralizes authorization rules.

## Bad

```ruby
class PostsController < ApplicationController
  def update
    @post = Post.find(params[:id])
    unless current_user.admin? || @post.author == current_user
      redirect_to root_path, alert: "Unauthorized"
      return
    end
    @post.update!(post_params)
  end
end
```


## Good

```ruby
# app/policies/post_policy.rb
class PostPolicy < ApplicationPolicy
  def update?
    user.admin? || record.author == user
  end
end

# app/controllers/posts_controller.rb
class PostsController < ApplicationController
  def update
    @post = Post.find(params[:id])
    authorize @post  # Raises Pundit::NotAuthorizedError if denied
    @post.update!(post_params)
  end
end
```


## See Also

- [rails-skinny-controller](./rails-skinny-controller.md)
- [sec-mass-assignment](./sec-mass-assignment.md)
