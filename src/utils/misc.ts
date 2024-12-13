import type { providers } from 'ethers';
import { log } from './logger';

const PROXY_IMPL_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

export function assertDefined<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) {
    log.error(message);
    process.exit(1);
  }
  return value;
}

export async function getProxyAddress(provider: providers.JsonRpcProvider, addr: string) {
  const data = await provider.getStorageAt(addr, PROXY_IMPL_SLOT);
  return '0x' + data.slice(26);
}