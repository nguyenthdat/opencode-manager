# raii-custom-deleter

> Use custom deleters for non-memory resources (FILE*, handles)

## Why It Matters

`unique_ptr`/`shared_ptr` aren't limited to `delete`-managed memory. Supplying a custom deleter lets you apply RAII to any resource with a "release" function — file handles, OS handles, C library objects — without writing a bespoke wrapper class each time.

## Bad

```cpp
void load_texture(const char* path) {
    SDL_Surface* surf = SDL_LoadBMP(path);
    if (!surf) throw std::runtime_error("load failed");

    upload_to_gpu(surf);
    SDL_FreeSurface(surf);   // Skipped if upload_to_gpu throws — leak
}
```

## Good

```cpp
#include <memory>

struct SdlSurfaceDeleter {
    void operator()(SDL_Surface* s) const noexcept { if (s) SDL_FreeSurface(s); }
};
using SurfacePtr = std::unique_ptr<SDL_Surface, SdlSurfaceDeleter>;

void load_texture(const char* path) {
    SurfacePtr surf(SDL_LoadBMP(path));
    if (!surf) throw std::runtime_error("load failed");

    upload_to_gpu(surf.get());
}   // Freed on every exit path, including exceptions
```

## Lambda Deleters for One-Off Resources

```cpp
auto make_handle(HANDLE raw) {
    return std::unique_ptr<void, void(*)(HANDLE)>(
        raw, [](HANDLE h) { if (h) CloseHandle(h); });
}

// Or with a stateless lambda decaying to a function pointer:
auto deleter = +[](FT_Library lib) { FT_Done_FreeType(lib); };
std::unique_ptr<FT_LibraryRec, decltype(deleter)> ft_lib(raw_lib, deleter);
```

## shared_ptr Custom Deleter (for shared, non-memory resources)

```cpp
std::shared_ptr<SDL_Surface> surf(
    SDL_LoadBMP(path),
    [](SDL_Surface* s) { SDL_FreeSurface(s); });
// Deleter is stored once in the control block, not per-copy.
```

## See Also

- [raii-file-handle-wrap](raii-file-handle-wrap.md) - Applying the same pattern to file handles specifically
- [own-unique-ptr-sole](own-unique-ptr-sole.md) - `unique_ptr` ownership semantics
- [raii-scope-bound-resources](raii-scope-bound-resources.md) - The general principle behind this rule
