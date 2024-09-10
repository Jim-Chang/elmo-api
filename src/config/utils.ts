import { existsSync } from 'fs';
import { join, resolve } from 'path';

const BASE_DIR = `${process.cwd()}/envs`;
const ENV_FILE_NAMES = [
  'env.$NODE_ENV.local',
  'env.$NODE_ENV',
  'env.local',
  'env',
];

export function getEnvPath(): string {
  const env: string = process.env.NODE_ENV || 'development';
  const fallbackPath = resolve(join(BASE_DIR, 'env'));

  let resolvedPath = ENV_FILE_NAMES.map((pathPattern) =>
    pathPattern.replace(/\$NODE_ENV/g, env),
  )
    .map((path) => resolve(join(BASE_DIR, path)))
    .find((path) => existsSync(path));

  if (!resolvedPath) {
    resolvedPath = fallbackPath;
  }

  return resolvedPath;
}
