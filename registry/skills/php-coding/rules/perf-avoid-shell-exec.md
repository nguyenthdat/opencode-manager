# perf-avoid-shell-exec

> Avoid `exec()`/`shell_exec()` in web requests

## Why It Matters

Shell commands in web requests spawn a new process, creating significant overhead. They're also a security risk if any user input reaches the command. Offload shell work to async queues, use native PHP functions, or call a microservice instead.

## Bad

```php
<?php

declare(strict_types=1);

class PdfController {
    public function generate(Request $request): Response {
        $html = view('invoice', ['order' => $order])->render();

        // Spawns external process on every request — slow and risky
        $output = shell_exec("wkhtmltopdf --page-size A4 - - 2>&1");
        // Also: exec(), passthru(), system(), proc_open()

        return response($output)->header('Content-Type', 'application/pdf');
    }
}
```

## Good

```php
<?php

declare(strict_types=1);

// Option 1: Native PHP library
use Dompdf\Dompdf;

class PdfController {
    public function generate(Request $request): Response {
        $dompdf = new Dompdf();
        $dompdf->loadHtml(view('invoice', ['order' => $order])->render());
        $dompdf->setPaper('A4');
        $dompdf->render();

        return response($dompdf->output())->header('Content-Type', 'application/pdf');
    }
}

// Option 2: Offload to queue (if must use shell tool)
class GeneratePdfJob implements ShouldQueue {
    public function handle(): void {
        $process = new \Symfony\Component\Process\Process([
            'wkhtmltopdf', '--page-size', 'A4', '-', $this->outputPath,
        ]);
        $process->setInput($this->html);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new PdfGenerationException($process->getErrorOutput());
        }
    }
}
```

## See Also

- [async-queue-jobs](./async-queue-jobs.md)
- [sec-input-sanitize](./sec-input-sanitize.md)
