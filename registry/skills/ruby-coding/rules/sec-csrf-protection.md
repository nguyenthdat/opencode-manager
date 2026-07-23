# sec-csrf-protection

> Use protect_from_forgery in Rails controllers

## Why It Matters

CSRF allows attackers to make requests on behalf of authenticated users. Rails' protect_from_forgery adds a CSRF token to forms and verifies it on non-GET requests. It's enabled by default -- never disable it without a specific, narrow reason.

## Bad

```ruby
class ApplicationController < ActionController::Base
  # Disabled -- vulnerable to CSRF!
  skip_before_action :verify_authenticity_token
end

class PaymentsController < ApplicationController
  # Never skip for destructive actions!
  skip_before_action :verify_authenticity_token
end
```


## Good

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception  # Default -- safe
end

# For API controllers that use token auth:
class Api::BaseController < ApplicationController
  protect_from_forgery with: :null_session
  before_action :authenticate_token!
end
```


## See Also

- [sec-cookie-secure](./sec-cookie-secure.md)
- [sec-mass-assignment](./sec-mass-assignment.md)
