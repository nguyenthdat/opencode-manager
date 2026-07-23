# perf-opcache-enable

> Enable OPcache in production

## Why It Matters

OPcache stores precompiled script bytecode in shared memory, eliminating PHP's need to parse and compile scripts on every request. This gives a 2-5x performance improvement at zero code change cost. Disable timestamp validation in production for maximum benefit.

## Bad

```php
<?php

// php.ini — default settings (suboptimal)
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000
opcache.validate_timestamps=1
opcache.revalidate_freq=2
```

## Good

```php
<?php

// Production php.ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=64
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0  // Don't check file timestamps in production
opcache.revalidate_freq=0
opcache.fast_shutdown=1
opcache.enable_file_override=1
opcache.max_wasted_percentage=10

// Development php.ini — validate timestamps for instant changes
opcache.validate_timestamps=1
opcache.revalidate_freq=0  // Check every request
```

## See Also

- [perf-jit-config](./perf-jit-config.md)
- [perf-autoload-optimize](./perf-autoload-optimize.md)
