import { spawn } from 'node:child_process';

const ITERATIONS = Number(process.env.SOAK_ITERATIONS || 5);

function runOnce() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/e2e-smoke.mjs'], { stdio: 'inherit', shell: false });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`smoke iteration failed with code ${code}`));
    });
  });
}

async function main() {
  for (let i = 1; i <= ITERATIONS; i++) {
    console.log(`SOAK iteration ${i}/${ITERATIONS}`);
    await runOnce();
  }
  console.log(`PASS soak: ${ITERATIONS} smoke iterations completed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
