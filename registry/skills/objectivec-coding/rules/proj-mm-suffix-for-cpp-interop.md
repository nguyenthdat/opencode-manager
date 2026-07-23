# proj-mm-suffix-for-cpp-interop

> Use `.mm` only for files that actually need C++ interop

## Why It Matters

Naming a file `.mm` forces Clang to compile it as Objective-C++, which pulls in the full C++ front end: slower compilation, C++ name-mangling and exception-handling ABI concerns, and the ability for a stray `#include <vector>` to silently start compiling as C++ where a plain `.m` file would have caught the mistake as a syntax error. Reserving `.mm` for files that genuinely bridge to a C++ library keeps the blast radius of "this file understands C++" limited to exactly the files that need it.

## Bad

```objc
// OMWJSONHelper.mm -- named .mm out of habit or "just in case," but
// contains no C++ at all. Now this file compiles noticeably slower
// than its .m siblings, and nothing stops a future editor from
// accidentally introducing C++-only syntax (e.g. `auto`, templates)
// that a plain Objective-C reviewer wouldn't expect to see here.
#import "OMWJSONHelper.h"

@implementation OMWJSONHelper

+ (NSDictionary *)dictionaryFromData:(NSData *)data error:(NSError **)error {
    return [NSJSONSerialization JSONObjectWithData:data options:0 error:error];
}

@end
```

## Good

```objc
// OMWJSONHelper.m -- plain Objective-C, no C++ involved, stays .m.
#import "OMWJSONHelper.h"

@implementation OMWJSONHelper

+ (NSDictionary *)dictionaryFromData:(NSData *)data error:(NSError **)error {
    return [NSJSONSerialization JSONObjectWithData:data options:0 error:error];
}

@end
```

```objc
// OMWAudioDecoder.mm -- correctly named .mm because it genuinely
// bridges to a C++ decoding library.
#import "OMWAudioDecoder.h"
#include "third_party/omw_codec/AudioDecoderEngine.hpp"

@implementation OMWAudioDecoder {
    std::unique_ptr<omw::codec::AudioDecoderEngine> _engine;
}

- (instancetype)init {
    if (self = [super init]) {
        _engine = std::make_unique<omw::codec::AudioDecoderEngine>();
    }
    return self;
}

- (NSData *)decodeSamplesFromData:(NSData *)compressedData {
    std::vector<uint8_t> input(static_cast<const uint8_t *>(compressedData.bytes),
                                static_cast<const uint8_t *>(compressedData.bytes) + compressedData.length);
    std::vector<float> output = _engine->decode(input);
    return [NSData dataWithBytes:output.data() length:output.size() * sizeof(float)];
}

@end
```

## Isolating C++ Behind a Thin ObjC++ Boundary

```objc
// Keep the C++ types confined to the .mm file's implementation; the
// header (.h) stays plain Objective-C so ordinary .m files can still
// #import it without becoming Objective-C++ themselves.
// OMWAudioDecoder.h
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface OMWAudioDecoder : NSObject
- (NSData *)decodeSamplesFromData:(NSData *)compressedData;
@end

NS_ASSUME_NONNULL_END
```

## See Also

- [`proj-one-class-per-file`](proj-one-class-per-file.md) - Keep one primary class per file, named to match
- [`proj-header-implementation-split`](proj-header-implementation-split.md) - Split public interface (`.h`) from implementation (`.m`)
- [`arc-bridge-corefoundation`](arc-bridge-corefoundation.md) - Use `__bridge`/`CFBridgingRetain`/`CFBridgingRelease` correctly at CF/ObjC boundaries
