import { log } from './logger';

export function assertDefined<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) {
    log.error(message);
    process.exit(1);
  }
  return value;
}