# sec-xss-prevention

> Escape HTML output; use Rails helpers

## Why It Matters

Cross-Site Scripting (XSS) allows attackers to inject JavaScript into pages viewed by other users. Rails escapes HTML by default in ERB templates, but raw, html_safe, and .html_safe bypass escaping. Never mark user-supplied content as HTML-safe.

## Bad

```ruby
# In view:
<%= raw @user.bio %>          # Dangerous -- user can inject <script>
<%= @comment.body.html_safe %> # Dangerous -- bypasses escaping

# In controller:
render html: params[:message].html_safe  # Never!
```


## Good

```ruby
# ERB escapes by default -- safe:
<%= @user.bio %>   # Escaped: <script> becomes &lt;script&gt;

# When rich text is needed, sanitize aggressively:
<%= sanitize @user.bio,
      tags: %w[b i strong em a],
      attributes: %w[href] %>

# Use content_tag helpers which auto-escape:
<%= tag.div class: "message" do %>
  <%= tag.p @user.name %>  <!-- Auto-escaped -->
<% end %>
```


## See Also

- [sec-sql-injection](./sec-sql-injection.md)
- [sec-cookie-secure](./sec-cookie-secure.md)
