import { mkdir, cp, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const path of ['index.html', 'styles.css', 'favicon.svg', 'src']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
console.log('Static game copied to dist/');
