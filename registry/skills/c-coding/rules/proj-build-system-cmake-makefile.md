# proj-build-system-cmake-makefile

> Use a real build system (CMake or a well-structured Makefile) with explicit warning/sanitizer flags, rather than ad hoc compile-and-run commands

## Why It Matters

A documented, reproducible build configuration ensures every contributor and every CI run compiles with the same standard version, warning flags, and optimization/sanitizer settings — the difference between "works on my machine" and a build that reliably catches bugs before merge.

## Bad

```sh
# Undocumented, inconsistent, ad hoc — every developer may compile differently
gcc main.c parser.c -o app
```

## Good — Makefile

```make
CC      = cc
STD     = -std=c17
WARN    = -Wall -Wextra -Wpedantic -Werror
SAN     = -fsanitize=address,undefined
CFLAGS  = $(STD) $(WARN) -g -O1 $(SAN)

SRCS    = main.c parser.c
OBJS    = $(SRCS:.c=.o)

app: $(OBJS)
	$(CC) $(CFLAGS) -o $@ $(OBJS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

test: app
	./app

clean:
	rm -f $(OBJS) app
```

## Good — CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.20)
project(mylib C)

set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)

add_compile_options(-Wall -Wextra -Wpedantic -Werror)

option(ENABLE_SANITIZERS "Build with ASan/UBSan" ON)
if(ENABLE_SANITIZERS)
  add_compile_options(-fsanitize=address,undefined)
  add_link_options(-fsanitize=address,undefined)
endif()

add_executable(app main.c parser.c)
enable_testing()
add_test(NAME app_test COMMAND app)
```

## See Also

- [lint-enable-wall-wextra-wpedantic](lint-enable-wall-wextra-wpedantic.md) - The warning flags used above
- [lint-werror-in-ci](lint-werror-in-ci.md) - Enforcing `-Werror` consistently
- [test-ci-matrix-compilers](test-ci-matrix-compilers.md) - Extending this into a full CI matrix
