import { Contract, type providers } from 'ethers'
import { getProxyAdmin } from './misc'

export async function getAllContractsFromInbox(
  provider: providers.JsonRpcProvider,
  inboxAddress: string
) {
  const inbox = new Contract(
    inboxAddress,
    ['function bridge() view returns (address)'],
    provider
  )
  const bridgeAddress = await inbox.bridge()
  const bridge = new Contract(
    bridgeAddress,
    [
      'function sequencerInbox() view returns (address)',
      'function rollup() view returns (address)',
    ],
    provider
  )
  const sequencerInboxAddress = await bridge.sequencerInbox()
  const rollupAddress = await bridge.rollup()
  const rollup = new Contract(
    rollupAddress,
    [
      'function outbox() view returns (address)',
      'function challengeManager() view returns (address)',
      'function rollupEventInbox() view returns (address)',
    ],
    provider
  )
  const outboxAddress = await rollup.outbox()
  const challengeManagerAddress = await rollup.challengeManager()
  const rollupEventInboxAddress = await rollup.rollupEventInbox()

  const proxyAdminAddress = await getProxyAdmin(provider, inboxAddress)
  const proxyAdmin = new Contract(
    proxyAdminAddress,
    ['function owner() view returns (address)'],
    provider
  )

  const upgradeExecutorAddress = await proxyAdmin.owner()

  return {
    proxyAdmin: proxyAdminAddress,
    inbox: inboxAddress,
    bridge: bridgeAddress,
    sequencerInbox: sequencerInboxAddress,
    rollup: rollupAddress,
    outbox: outboxAddress,
    challengeManager: challengeManagerAddress,
    rollupEventInbox: rollupEventInboxAddress,
    upgradeExecutor: upgradeExecutorAddress,
  }
}
