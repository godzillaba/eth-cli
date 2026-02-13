import { Contract, type providers } from 'ethers'

const ARB_AGGREGATOR = '0x000000000000000000000000000000000000006D'
const ARB_GAS_INFO = '0x000000000000000000000000000000000000006C'
const ARB_OWNER_PUBLIC = '0x000000000000000000000000000000000000006b'
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
