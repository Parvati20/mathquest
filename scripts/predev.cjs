const { rmSync } = require('node:fs');
const killPort = require('kill-port');

async function tryKill(port) {
  try {
    await killPort(port);
    console.log(`Freed port ${port}`);
  } catch {
    // Ignore when nothing is listening or process cannot be targeted.
  }
}

async function main() {
  await tryKill(3000);
  await tryKill(3001);

  try {
    rmSync('.next', { recursive: true, force: true });
    console.log('Cleared .next');
  } catch {
    // Keep startup resilient even if cleanup is partially blocked.
  }
}

main().catch(() => {
  // Never block `npm run dev` because of cleanup.
  process.exit(0);
});
