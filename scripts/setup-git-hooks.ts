import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "..");

async function run(command: string[], capture = false): Promise<string> {
  const child = Bun.spawn(command, {
    cwd: projectRoot,
    stdout: capture ? "pipe" : "inherit",
    stderr: capture ? "pipe" : "inherit",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    capture ? new Response(child.stdout).text() : "",
    capture ? new Response(child.stderr).text() : "",
  ]);
  if (exitCode !== 0) throw new Error(stderr.trim() || `${command[0]} exited with code ${exitCode}`);
  return stdout.trim();
}

async function main(): Promise<void> {
  let gitDirectory: string;
  try {
    gitDirectory = await run(["git", "rev-parse", "--git-dir"], true);
  } catch {
    console.log("[INFO] No Git worktree found; skipping pre-commit hook setup.");
    return;
  }

  const hooksPath = join(resolve(projectRoot, gitDirectory), "hooks");
  await run(["git", "config", "--local", "core.hooksPath", hooksPath]);
  await run(["bunx", "simple-git-hooks"]);
}

await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
