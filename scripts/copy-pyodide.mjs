import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const source = resolve('node_modules/pyodide');
const destination = resolve('public/pyodide');
const assets = ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
mkdirSync(destination, { recursive: true });
for (const asset of assets) copyFileSync(resolve(source, asset), resolve(destination, asset));
const version = JSON.parse(readFileSync(resolve(source, 'package.json'), 'utf8')).version;
console.log('Copied Pyodide ' + version + ' assets to public/pyodide.');
