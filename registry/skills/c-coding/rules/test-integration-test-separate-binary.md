# test-integration-test-separate-binary

> Build integration tests as a separate test binary/executable from unit tests, linking against the library rather than duplicating its source

## Why It Matters

Integration tests (exercising a whole binary, a full request/response cycle, or multiple modules together through their real public API) have different concerns from unit tests — slower runtime, real I/O, and a need to test only through public interfaces. Keeping them in a distinct binary, built against the library's actual public headers, ensures they can't accidentally depend on internal/`static` details the unit tests are allowed to reach into.

## Bad

```c
/* Integration test file directly #includes the library's .c files to reach
 * internal helpers, coupling it to implementation details a "real" external
 * consumer of the library could never rely on. */
#include "../src/parser.c"   /* pulls in static helpers, private structs, etc. */
```

## Good

```
project/
  src/                     # library sources, compiled into libwidget.a
  include/widget.h          # public API only
  tests/
    unit/                    # fast, may use internal test-only headers
    integration/              # only #include <widget.h>, links against libwidget.a
```

```c
/* tests/integration/test_end_to_end.c */
#include <widget.h>   /* only the public API, exactly as a real consumer would use it */

int main(void) {
    widget *w = widget_create("test");
    assert(w != NULL);
    assert(widget_process(w, sample_input, sizeof(sample_input)) == 0);
    widget_destroy(w);
    return 0;
}
```

## Build System Wiring

```make
libwidget.a: $(SRC_OBJS)
	ar rcs $@ $^

test_integration: tests/integration/test_end_to_end.c libwidget.a
	$(CC) $(CFLAGS) -Iinclude $^ -o $@
```

## See Also

- [proj-public-vs-private-headers-dir](proj-public-vs-private-headers-dir.md) - The header split this test structure relies on
- [test-unit-test-framework](test-unit-test-framework.md) - Unit-level testing, run alongside integration tests
- [proj-build-system-cmake-makefile](proj-build-system-cmake-makefile.md) - Wiring both test suites into the build
