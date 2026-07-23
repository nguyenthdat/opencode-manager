# doc-doxygen-function-comments

> Document every public function with a Doxygen-style comment covering its purpose, parameters, return value, and error conditions

## Why It Matters

Doxygen (and compatible tools) can generate browsable API reference documentation automatically from structured comments, and many editors surface these comments as inline tooltips at call sites. A consistent, complete format means every public function gets real documentation "for free" as a side effect of writing the comment once, correctly.

## Bad

```c
/* parses a config file */
int config_load(const char *path, struct config *out);
/* no parameter descriptions, no mention of the return convention or error cases */
```

## Good

```c
/**
 * @brief Load and parse a configuration file into `out`.
 *
 * @param path  Null-terminated path to the config file. Must not be NULL.
 * @param out   Destination struct; left unmodified on failure.
 *
 * @return 0 on success.
 * @return -ENOENT if the file does not exist.
 * @return -EINVAL if the file exists but is not valid config syntax.
 */
int config_load(const char *path, struct config *out);
```

## Documenting Structs and Fields Too

```c
/**
 * @brief Represents parsed application configuration.
 */
struct config {
    int  timeout_ms;   /**< Request timeout in milliseconds; must be > 0. */
    bool verbose;        /**< Enables debug logging when true. */
};
```

## Generating Docs From These Comments

```sh
doxygen Doxyfile   # produces browsable HTML/LaTeX API reference from the comments above
```

## See Also

- [doc-document-error-conditions](doc-document-error-conditions.md) - The error-condition section shown above, in more depth
- [err-document-error-contract](err-document-error-contract.md) - Keeping the documented error contract accurate
- [api-minimal-public-surface](api-minimal-public-surface.md) - Only public functions need this level of documentation
