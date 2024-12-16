import type { providers } from 'ethers'
import { log } from './logger'
import { getAddress } from 'ethers/lib/utils'

const PROXY_IMPL_SLOT =
  '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

export function assertDefined<T>(
  value: T | undefined | null,
  message: string
): T {
  if (value === undefined || value === null) {
    log.error(message)
    process.exit(1)
  }
  return value
}

export async function getProxyImpl(
  provider: providers.JsonRpcProvider,
  addr: string
) {
  return wordToAddr(await provider.getStorageAt(addr, PROXY_IMPL_SLOT))
}

export function wordToAddr(word: string) {
  if (word.length !== 66) {
    log.error('Invalid word length')
    process.exit(1)
  }
  return getAddress('0x' + word.slice(26))
}

/**
 * Extract the metadata hash from the bytecode. MUST BE DEPLOYED BYTECODE, NOT DEPLOYMENT BYTECODE.
 */
export function extractMetadata(bytecode: string) {
  // get length from last 2 bytes
  const len = parseInt(bytecode.slice(-4), 16)
  return bytecode.slice(-4 - len * 2)
}
