# mem-struct-field-padding

> Compute struct field offsets from the compiler's actual layout (with padding), never from the sum of field sizes

## Why It Matters

C compilers insert padding between struct fields to satisfy each field's alignment requirement, and often add trailing padding so the whole struct's size is a multiple of its strictest member's alignment. Assembly that indexes into a C struct by hand must match that real, padded layout exactly, or it reads/writes the wrong field.

## Bad

```c
/* C struct definition */
struct Point3D {
    int8_t  flag;   /* offset 0 */
    int32_t x;      /* offset 4, NOT 1 -- padding inserted for 4-byte alignment */
    int32_t y;      /* offset 8 */
    int32_t z;      /* offset 12 */
};                    /* sizeof == 16 */
```

```asm
# x86-64 AT&T - assumes no padding: offsets computed from raw field sizes
.global read_x_wrong
read_x_wrong:
    mov  1(%rdi), %eax     # BUG: 'x' is actually at offset 4, not 1
    ret
```

## Good

```asm
# x86-64 AT&T - offsets match the compiler's real (padded) layout
.equ POINT3D_FLAG, 0
.equ POINT3D_X,    4
.equ POINT3D_Y,    8
.equ POINT3D_Z,    12

.global read_x
read_x:
    mov  POINT3D_X(%rdi), %eax
    ret
```

## Verify, Don't Guess

Generate the offsets from the compiler rather than computing them by hand:

```c
/* offsetof lets you assert the offset you assumed matches reality */
#include <stddef.h>
_Static_assert(offsetof(struct Point3D, x) == 4, "layout changed");
```

```bash
# Or inspect it directly
gcc -g -c point3d.c -o point3d.o
pahole point3d.o        # shows field offsets and padding
```

## See Also

- [interop-struct-layout-agreement](interop-struct-layout-agreement.md) - Keeping asm and C struct layouts in sync over time
- [doc-frame-layout-comment](doc-frame-layout-comment.md) - Documenting hand-managed offsets similarly
- [anti-hardcoded-stack-offset](anti-hardcoded-stack-offset.md) - The stack-frame analog of this mistake
