# perf-jit-config

> Configure JIT compiler for CPU-bound workloads

## Why It Matters

PHP 8.0+ JIT compiles hot code paths to native machine code. For CPU-bound apps (data processing, ML, image manipulation), tracing JIT can provide 2-5x performance gains. Web apps benefit less — test before enabling in production.

## Bad

```php
<?php

// php.ini — JIT disabled (default)
opcache.jit=off
opcache.jit_buffer_size=0

// No JIT — CPU-bound tasks run in interpreted mode
```

## Good

```php
<?php

// php.ini — JIT for CPU-bound workloads
opcache.jit=tracing
opcache.jit_buffer_size=100M
opcache.jit_debug=0

// For web apps — function JIT may be sufficient
opcache.jit=function
opcache.jit_buffer_size=50M

// Fine-grained control
opcache.jit=1255
// 1 = function JIT
// 2 = tracing JIT
// 5 = maximum optimization

// Verify JIT is active
var_dump(opcache_get_status()['jit']);
```

## See Also

- [perf-opcache-enable](./perf-opcache-enable.md)
- [perf-autoload-optimize](./perf-autoload-optimize.md)
