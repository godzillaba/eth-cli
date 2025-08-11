import { providers } from 'ethers'
import { log } from './logger'
import { getAddress } from 'ethers/lib/utils'

const PROXY_IMPL_SLOT =
  '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

const PROXY_ADMIN_SLOT =
  '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'

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

export async function getImplOfClone(
  provider: providers.JsonRpcProvider,
  addr: string
): Promise<string | null> {
  const proxyCode = '0x363d3d373d3d3d363d73_5af43d82803e903d91602b57fd5bf3'
  const code = (await provider.getCode(addr)).toLowerCase()
  const implIdx = proxyCode.indexOf('_')
  if (code.length != proxyCode.length + 39) {
    return null
  }
  if (code.slice(0, implIdx) !== proxyCode.slice(0, implIdx)) {
    return null // Not a clone
  }
  if (code.slice(implIdx + 40) !== proxyCode.slice(implIdx + 1)) {
    return null // Not a clone
  }
  return getAddress(code.slice(implIdx, implIdx + 40))
}

export async function getProxyImpl(
  provider: providers.JsonRpcProvider,
  addr: string
): Promise<string> {
  return (
    (await getImplOfClone(provider, addr)) ??
    wordToAddr(await provider.getStorageAt(addr, PROXY_IMPL_SLOT))
  )
}

export async function getProxyAdmin(
  provider: providers.JsonRpcProvider,
  addr: string
): Promise<string> {
  return wordToAddr(await provider.getStorageAt(addr, PROXY_ADMIN_SLOT))
}

export function wordToAddr(word: string): string {
  if (word.length !== 66) {
    log.error('Invalid word length')
    process.exit(1)
  }
  return getAddress('0x' + word.slice(26))
}

/**
 * Extract the metadata hash from the bytecode. MUST BE DEPLOYED BYTECODE, NOT DEPLOYMENT BYTECODE.
 * Includes the 2 byte length suffix.
 */
export function extractMetadata(bytecode: string): string {
  // get length from last 2 bytes
  const len = parseInt(bytecode.slice(-4), 16)
  return bytecode.slice(-4 - len * 2)
}
