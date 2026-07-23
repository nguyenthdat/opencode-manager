# raii-file-handle-wrap

> Wrap OS/file handles in RAII types

## Why It Matters

Raw OS handles (POSIX file descriptors, Windows `HANDLE`, C `FILE*`) have no destructor of their own. Every function that acquires one must remember to release it on every exit path. Wrapping the handle once in an RAII type (or using `std::fstream`/`std::ifstream`/`std::ofstream` for standard file I/O) removes this obligation from every call site permanently.

## Bad

```cpp
void copy_file(const char* src, const char* dst) {
    int in = ::open(src, O_RDONLY);
    if (in < 0) throw std::runtime_error("open src failed");

    int out = ::open(dst, O_WRONLY | O_CREAT, 0644);
    if (out < 0) {
        ::close(in);           // Must remember this on this path...
        throw std::runtime_error("open dst failed");
    }

    do_copy(in, out);          // If this throws, both fds leak
    ::close(in);
    ::close(out);
}
```

## Good

```cpp
class FileDescriptor {
public:
    explicit FileDescriptor(int fd) : fd_(fd) {}
    ~FileDescriptor() { if (fd_ >= 0) ::close(fd_); }

    FileDescriptor(FileDescriptor&& other) noexcept
        : fd_(std::exchange(other.fd_, -1)) {}
    FileDescriptor& operator=(FileDescriptor&& other) noexcept {
        if (this != &other) {
            if (fd_ >= 0) ::close(fd_);
            fd_ = std::exchange(other.fd_, -1);
        }
        return *this;
    }
    FileDescriptor(const FileDescriptor&) = delete;
    FileDescriptor& operator=(const FileDescriptor&) = delete;

    int get() const noexcept { return fd_; }
    bool valid() const noexcept { return fd_ >= 0; }

private:
    int fd_;
};

void copy_file(const char* src, const char* dst) {
    FileDescriptor in(::open(src, O_RDONLY));
    if (!in.valid()) throw std::runtime_error("open src failed");

    FileDescriptor out(::open(dst, O_WRONLY | O_CREAT, 0644));
    if (!out.valid()) throw std::runtime_error("open dst failed");

    do_copy(in.get(), out.get());
}   // Both fds closed automatically, on every exit path
```

## Prefer Standard Library Wrappers When Available

```cpp
#include <fstream>

void copy_file(const std::filesystem::path& src, const std::filesystem::path& dst) {
    std::ifstream in(src, std::ios::binary);
    std::ofstream out(dst, std::ios::binary);
    out << in.rdbuf();
}   // Both streams closed automatically
```

## See Also

- [raii-custom-deleter](raii-custom-deleter.md) - `unique_ptr` with a custom deleter as an alternative
- [own-move-transfer](own-move-transfer.md) - Move-only semantics for exclusive handle ownership
- [raii-rule-of-five](raii-rule-of-five.md) - Full special-member implementation shown above
