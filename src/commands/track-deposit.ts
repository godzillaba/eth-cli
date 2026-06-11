import { Command } from '@commander-js/extra-typings'
import { providers, Wallet } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { assertDefined } from '../utils/misc'
import { log } from '../utils/logger'
import {
  EthDepositMessageStatus,
  getArbitrumNetworks,
  ParentToChildMessageStatus,
  ParentTransactionReceipt,
  registerCustomArbitrumNetwork,
} from '@arbitrum/sdk'

const RETRYABLE_STATUS = {
  [ParentToChildMessageStatus.NOT_YET_CREATED]: 'NOT_YET_CREATED',
  [ParentToChildMessageStatus.CREATION_FAILED]: 'CREATION_FAILED',
  [ParentToChildMessageStatus.FUNDS_DEPOSITED_ON_CHILD]: 'FUNDS_DEPOSITED_ON_CHILD',
  [ParentToChildMessageStatus.REDEEMED]: 'REDEEMED',
  [ParentToChildMessageStatus.EXPIRED]: 'EXPIRED',
}

const ETH_DEPOSIT_STATUS = {
  [EthDepositMessageStatus.PENDING]: 'PENDING',
  [EthDepositMessageStatus.DEPOSITED]: 'DEPOSITED',
}

function printStatus(status: string) {
  if (status === 'REDEEMED' || status === 'DEPOSITED') return log.success(`  status: ${status}`)
  if (status === 'CREATION_FAILED' || status === 'EXPIRED') return log.error(`  status: ${status}`)
  log.warning(`  status: ${status}`)
}

export function trackDepositCommand(program: Command) {
  program
    .command('track-deposit')
    .description('Track all L1->L2 messages (eth deposits, retryables) from a parent tx')
    .argument('<PARENT_TX>', 'L1->L2 message tx on parent')
    .option('-p, --parent-rpc <PARENT_RPC>', 'Parent RPC URL')
    .option('-c, --child-rpc <CHILD_RPC>', 'Child RPC URL')
    .option('-k, --private-key <PRIVATE_KEY>', 'Private key to redeem redeemable retryables')
    .option('-i, --inbox <INBOX_ADDRESS>', 'Inbox address if custom chain')
    .action(async (tx, options) => {
      const parentProvider = new providers.JsonRpcProvider(
        assertDefined(options.parentRpc, 'Parent RPC URL is required')
      )
      const childProvider = new providers.JsonRpcProvider(
        assertDefined(options.childRpc, 'Child RPC URL is required')
      )
      const childSigner = new Wallet(
        options.privateKey || '0x0000000000000000000000000000000000000000000000000000000000000001',
        childProvider
      )

      const childChainId = (await childProvider.getNetwork()).chainId
      if (!getArbitrumNetworks().map(n => n.chainId).includes(childChainId)) {
        registerCustomArbitrumNetwork({
          name: 'Custom',
          chainId: childChainId,
          parentChainId: (await parentProvider.getNetwork()).chainId,
          ethBridge: {
            bridge: '',
            inbox: assertDefined(options.inbox, 'Inbox address is required for custom chain'),
            sequencerInbox: '',
            outbox: '',
            rollup: '',
          },
          confirmPeriodBlocks: 0,
          isTestnet: false,
          isCustom: true,
        })
      }

      const rec = new ParentTransactionReceipt(
        assertDefined(
          await parentProvider.getTransactionReceipt(tx),
          `Tx ${tx} not found on parent`
        )
      )

      const ethDeposits = await rec.getEthDeposits(childProvider)
      const retryables = await rec.getParentToChildMessages(childSigner)

      if (ethDeposits.length + retryables.length === 0) {
        log.warning('No L1->L2 messages found in this tx')
        return
      }

      for (const dep of ethDeposits) {
        log.info(`[ETH deposit] message #${dep.messageNumber.toString()}`)
        log.info(`  from ${dep.from} to ${dep.to}`)
        log.info(`  value: ${formatEther(dep.value)} ETH`)
        log.info(`  child tx: ${dep.childTxHash}`)
        printStatus(ETH_DEPOSIT_STATUS[await dep.status()])
      }

      for (const msg of retryables) {
        log.info(`[Retryable] message #${msg.messageNumber.toString()}`)
        log.info(`  from ${msg.sender} to ${msg.messageData.destAddress}`)
        log.info(`  l2 call value: ${formatEther(msg.messageData.l2CallValue)} ETH`)
        log.info(`  retryable creation id: ${msg.retryableCreationId}`)
        const status = await msg.status()
        printStatus(RETRYABLE_STATUS[status])

        if (options.privateKey && status === ParentToChildMessageStatus.FUNDS_DEPOSITED_ON_CHILD) {
          const redemptionTx = await msg.redeem()
          log.info(`  redemption tx: ${redemptionTx.hash}`)
          await redemptionTx.wait()
          log.success('  redeemed')
        }
      }
    })
}
