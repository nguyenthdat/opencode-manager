# api-callback-with-userdata

> Give every callback-accepting API a `void *user_data` (or `ctx`) parameter, threaded through unchanged to the callback

## Why It Matters

C has no closures, so a callback function alone cannot carry state from the point where it was registered. Without a `void *` context parameter, callback implementers are forced to use global or `static` variables to smuggle in the data they need — which breaks re-entrancy and makes the same callback unusable for two independent registrations at once.

## Bad

```c
typedef void (*on_event_fn)(int event_code);

void register_handler(on_event_fn fn);

static int g_widget_id;   /* smuggled in via a global because the callback takes no context */
void my_handler(int event_code) {
    handle_for_widget(g_widget_id, event_code);   /* breaks if two widgets register handlers */
}
```

## Good

```c
typedef void (*on_event_fn)(int event_code, void *user_data);

void register_handler(on_event_fn fn, void *user_data);

void my_handler(int event_code, void *user_data) {
    struct widget *w = (struct widget *)user_data;   /* explicit, per-registration context */
    handle_for_widget(w, event_code);
}

register_handler(my_handler, widget_a);
register_handler(my_handler, widget_b);   /* same callback, two independent contexts */
```

## Passing user_data Through Unchanged

```c
/* The library must never inspect or modify user_data itself — it exists
 * purely to be handed back verbatim, exactly like the callback contract for
 * qsort_r or pthread_create's argument. */
void dispatch(on_event_fn fn, void *user_data, int event_code) {
    fn(event_code, user_data);   /* passed through untouched */
}
```

## See Also

- [ptr-function-pointer-typedef](ptr-function-pointer-typedef.md) - Typedef'ing the callback signature itself
- [ptr-explicit-void-cast](ptr-explicit-void-cast.md) - Casting `user_data` back to its concrete type safely
- [ub-invalid-function-pointer-cast](ub-invalid-function-pointer-cast.md) - Why the callback signature must stay consistent
