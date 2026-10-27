import type { Round, RoundMetadata } from '../types/round';
import metadata from '../../rounds/ecommerce-cart-bug/round.json';

const rawRoundFiles = import.meta.glob('../../rounds/ecommerce-cart-bug/files/**/*.{py,md}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const files = Object.entries(rawRoundFiles)
  .map(([modulePath, content]) => ({
    path: modulePath.split('/files/')[1],
    language: modulePath.endsWith('.md') ? 'markdown' as const : 'python' as const,
    content,
  }))
  .sort((left, right) => left.path.localeCompare(right.path));

export const cartRound: Round = {
  id: 'ecommerce-cart-bug',
  entryFile: 'app/main.py',
  ...(metadata as RoundMetadata),
  files,
};

export const roundFiles = Object.fromEntries(files.map(file => [file.path, file.content]));
