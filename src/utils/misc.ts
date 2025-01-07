import { Contract, type providers } from 'ethers'
import { log } from './logger'
import { getAddress, Interface } from 'ethers/lib/utils'

const PROXY_IMPL_SLOT =
  '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
const ARB_AGGREGATOR = '0x000000000000000000000000000000000000006D'
const ARB_GAS_INFO = '0x000000000000000000000000000000000000006C'
const ARB_OWNER_PUBLIC = '0x000000000000000000000000000000000000006b'

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
): Promise<string> {
  return wordToAddr(await provider.getStorageAt(addr, PROXY_IMPL_SLOT))
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

/**
 * Get the batch posters of a chain.
 */
export function getBatchPosters(
  provider: providers.JsonRpcProvider
): Promise<string[]> {
  const contract = new Contract(
    ARB_AGGREGATOR,
    ['function getBatchPosters() view returns (address[])'],
    provider
  )
  return contract.getBatchPosters()
}

/**
 * Get the L1 base fee collector of a batch poster.
 */
export function getL1BaseFeeCollector(
  provider: providers.JsonRpcProvider,
  batchPoster: string
): Promise<string> {
  const contract = new Contract(
    ARB_AGGREGATOR,
    ['function getFeeCollector(address) view returns (address)'],
    provider
  )
  return contract.getFeeCollector(batchPoster)
}

/**
 * Get the L1 surplus fee collector of a chain.
 */
export function getL1SurplusFeeCollector(
  provider: providers.JsonRpcProvider
): Promise<string> {
  const contract = new Contract(
    ARB_GAS_INFO,
    ['function getL1RewardRecipient() view returns (address)'],
    provider
  )
  return contract.getL1RewardRecipient()
}

/**
 * Get the L2 base fee collector of a chain.
 */
export function getL2BaseFeeCollector(
  provider: providers.JsonRpcProvider
): Promise<string> {
  const contract = new Contract(
    ARB_OWNER_PUBLIC,
    ['function getInfraFeeAccount() view returns (address)'],
    provider
  )
  return contract.getInfraFeeAccount()
}

/**
 * Get the L2 surplus fee collector of a chain.
 */
export function getL2SurplusFeeCollector(
  provider: providers.JsonRpcProvider
): Promise<string> {
  const contract = new Contract(
    ARB_OWNER_PUBLIC,
    ['function getNetworkFeeAccount() view returns (address)'],
    provider
  )
  return contract.getNetworkFeeAccount()
}
