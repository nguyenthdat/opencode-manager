# perf-cache-friendly-soa

> Prefer structure-of-arrays for cache-friendly loops

## Why It Matters

An array-of-structures (AoS) layout stores all fields of each element contiguously, so a loop that only reads one field per element still pulls the whole struct (including unused fields) into cache, wasting bandwidth and cache capacity. A structure-of-arrays (SoA) layout stores each field in its own contiguous array, so a loop over one field reads only that field's data — maximizing cache line utilization and enabling auto-vectorization.

## Bad — Array of Structures

```cpp
struct Particle {
    float x, y, z;         // Position
    float vx, vy, vz;       // Velocity
    float mass;
    Color color;             // Rendering-only data, irrelevant to physics
};

std::vector<Particle> particles;

void update_positions(std::vector<Particle>& particles, float dt) {
    for (auto& p : particles) {
        p.x += p.vx * dt;   // Loads the ENTIRE Particle (including color!) into
        p.y += p.vy * dt;   // cache just to touch position and velocity fields
        p.z += p.vz * dt;
    }
}
```

## Good — Structure of Arrays

```cpp
struct ParticleSystem {
    std::vector<float> x, y, z;
    std::vector<float> vx, vy, vz;
    std::vector<float> mass;
    std::vector<Color> color;
};

void update_positions(ParticleSystem& particles, float dt) {
    const size_t n = particles.x.size();
    for (size_t i = 0; i < n; ++i) {
        particles.x[i] += particles.vx[i] * dt;   // Only touches the arrays
        particles.y[i] += particles.vy[i] * dt;    // actually needed — dense,
        particles.z[i] += particles.vz[i] * dt;     // vectorizable access pattern
    }
}
```

## When AoS Is Still the Right Choice

```cpp
// If code consistently accesses ALL fields of an element together (rather
// than one field across many elements), AoS keeps related data together
// and can be the better layout. Choose based on the actual access pattern,
// and measure — this is a data-layout trade-off, not a universal rule.
```

## See Also

- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Confirming cache behavior is actually the bottleneck
- [perf-algorithm-over-handwritten-loop](perf-algorithm-over-handwritten-loop.md) - Algorithms that benefit from this layout
- [mem-vector-over-manual](mem-vector-over-manual.md) - `std::vector` as the underlying contiguous storage
