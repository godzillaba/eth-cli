import { Command } from '@commander-js/extra-typings'
import { providers, Wallet } from 'ethers'
import { assertDefined } from '../utils/misc'
import { getArbitrumNetworks, ParentToChildMessageStatus, ParentTransactionReceipt, registerCustomArbitrumNetwork } from '@arbitrum/sdk'

export function retryableRedeemCommand(program: Command) {
  program
    .command('retryable-redeem')
    .description('Redeem a retryable')
    .argument('<PARENT_TX>', 'Deposit tx on parent')
    .option('-p, --parent-rpc <PARENT_RPC>', 'Parent RPC URL')
    .option('-c, --child-rpc <CHILD_RPC>', 'Child RPC URL')
    .option(
      '-k, --private-key <PRIVATE_KEY>',
      'Private key to sign the transaction'
    )
    .option(
      '-i, --inbox <INBOX_ADDRESS>',
      'Inbox address if custom chain'
    )
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
      const rec = new ParentTransactionReceipt(
        await parentProvider.getTransactionReceipt(tx)
      )
      if (!getArbitrumNetworks().map(n => n.chainId).includes(childProvider.network.chainId)) {
        registerCustomArbitrumNetwork({
          name: 'Custom',
          chainId: childProvider.network.chainId,
          parentChainId: parentProvider.network.chainId,
          ethBridge: {
            bridge: '',
            inbox: assertDefined(options.inbox, 'Inbox address is required for custom chain'),
            sequencerInbox: '',
            outbox: '',
            rollup: ''
          },
          confirmPeriodBlocks: 0,
          isTestnet: false,
          isCustom: true
        })
      }
        
      const events = await rec.getParentToChildMessages(childSigner)
      if (events.length !== 1) {
        throw new Error(`Expected 1 event, got ${events.length}`)
      }

      const event = events[0]

      const statusStr = {
        [ParentToChildMessageStatus.NOT_YET_CREATED]: 'NOT_YET_CREATED',
        [ParentToChildMessageStatus.CREATION_FAILED]: 'CREATION_FAILED',
        [ParentToChildMessageStatus.FUNDS_DEPOSITED_ON_CHILD]: 'FUNDS_DEPOSITED_ON_CHILD',
        [ParentToChildMessageStatus.REDEEMED]: 'REDEEMED',
        [ParentToChildMessageStatus.EXPIRED]: 'EXPIRED',
      }[await event.status()]
      console.log(`Parent to child message status: ${statusStr}`)

      if (!options.privateKey) {
        console.log(`No private key provided, skipping redemption.`)
        return
      }

      const redemptionTx = await event.redeem()
      console.log('Redemption tx:', redemptionTx.hash)
      await redemptionTx.wait()
      console.log('Redemption tx confirmed')
    })
}
