# sec-file-upload

> Validate file type, size; store outside web root

## Why It Matters

Unrestricted file uploads allow attackers to upload executable scripts. Validate MIME type (not just extension), limit file size, generate random filenames, and store uploaded files outside the web root so they can't be directly accessed.

## Bad

```php
<?php

declare(strict_types=1);

// No validation — accepts anything
$target = '/var/www/html/uploads/' . $_FILES['file']['name'];
move_uploaded_file($_FILES['file']['tmp_name'], $target);

// Only checks extension — easily spoofed
$ext = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
if ($ext === 'jpg') {
    move_uploaded_file($_FILES['file']['tmp_name'], '/uploads/' . $_FILES['file']['name']);
}
```

## Good

```php
<?php

declare(strict_types=1);

class FileUploader {
    private const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    private const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
    private const STORAGE_PATH = '/var/storage/uploads'; // Outside web root

    public function upload(array $file): UploadedFile {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new UploadException('Upload error: ' . $file['error']);
        }
        if ($file['size'] > self::MAX_SIZE) {
            throw new UploadException('File too large');
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if (!in_array($mimeType, self::ALLOWED_MIMES, true)) {
            throw new UploadException("Invalid file type: {$mimeType}");
        }

        $extension = match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        };
        $filename = bin2hex(random_bytes(16)) . '.' . $extension;

        if (!is_dir(self::STORAGE_PATH)) {
            mkdir(self::STORAGE_PATH, 0750, true);
        }

        move_uploaded_file($file['tmp_name'], self::STORAGE_PATH . '/' . $filename);
        return new UploadedFile($filename, $mimeType, $file['size']);
    }
}
```

## See Also

- [sec-path-traversal](./sec-path-traversal.md)
- [sec-input-sanitize](./sec-input-sanitize.md)
