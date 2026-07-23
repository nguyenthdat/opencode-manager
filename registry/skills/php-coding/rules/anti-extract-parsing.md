# anti-extract-parsing

> Don't use `extract()` or `parse_str()` with untrusted data

## Why It Matters

`extract()` creates variables from array keys — with untrusted input, it can overwrite existing variables (`$_SESSION`, `$config`, `$db`). `parse_str()` has the same risk. Both make code impossible to analyze statically.

## Bad

```php
<?php

declare(strict_types=1);

class UserController {
    public function update(Request $request): void {
        // Creates variables: $name, $email, $password from request
        extract($request->input());

        // $name, $email, $password — where did they come from?
        $user = User::find($id); // $id from extract?
        $user->update(compact('name', 'email', 'password'));
    }
}

// parse_str with untrusted input
$query = $_SERVER['QUERY_STRING'];
parse_str($query, $params); // Safer: provides array
// But: parse_str($query); — creates variables from query string!
```

## Good

```php
<?php

declare(strict_types=1);

class UserController {
    public function update(UpdateUserRequest $request): void {
        // Explicit access — traceable, analyzable
        $data = $request->validated();
        $name = $data['name'];
        $email = $data['email'];

        $user = User::find($request->id);
        $user->update([
            'name' => $name,
            'email' => $email,
        ]);
    }
}

// If you must use parse_str — always with second parameter
$query = $_SERVER['QUERY_STRING'];
parse_str($query, $params); // Stores in $params array, not global scope
$page = (int) ($params['page'] ?? 1);

// Never: parse_str($query); // Creates variables in current scope!
```

## See Also

- [sec-input-sanitize](./sec-input-sanitize.md)
- [anti-global-state](./anti-global-state.md)
