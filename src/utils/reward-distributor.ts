import { BigNumber, Contract, type providers } from 'ethers'
import { getSourceCode } from './etherscan'
import { getLogsPaginated } from './get-logs'

import REWARD_DISTRIBUTOR_ABI from '../abi/RewardDistributor.json'
import { Interface } from 'ethers/lib/utils'
const iface = new Interface(REWARD_DISTRIBUTOR_ABI)

export async function isRewardDistributor(
  addr: string,
  provider: providers.JsonRpcProvider
): Promise<boolean> {
  const chainId = (await provider.getNetwork()).chainId
  const contractName = (await getSourceCode(chainId, addr)).ContractName
  return contractName === 'RewardDistributor'
}

export async function getRewardDistributorRecipients(
  addr: string,
  provider: providers.JsonRpcProvider
) {
  const logs = await getLogsPaginated(provider, {
    address: addr,
    topics: [iface.getEventTopic('RecipientsUpdated')],
  })

  if (logs.length === 0) {
    return null
  }

  const lastLog = logs[logs.length - 1]

  const decoded = iface.decodeEventLog(
    'RecipientsUpdated',
    lastLog.data,
    lastLog.topics
  )

  const owner: string = await new Contract(
    addr,
    REWARD_DISTRIBUTOR_ABI,
    provider
  ).owner()

  return {
    owner,
    recipients: decoded.recipients as string[],
    weights: decoded.weights as BigNumber[],
  }
}
