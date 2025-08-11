import { Command } from '@commander-js/extra-typings'
import { providers, Wallet } from 'ethers'
import { assertDefined } from '../utils/misc'
import { ParentTransactionReceipt } from '@arbitrum/sdk'

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
    .action(async (tx, options) => {
      const parentProvider = new providers.JsonRpcProvider(
        assertDefined(options.parentRpc, 'Parent RPC URL is required')
      )
      const childProvider = new providers.JsonRpcProvider(
        assertDefined(options.childRpc, 'Child RPC URL is required')
      )
      const childSigner = new Wallet(
        assertDefined(options.privateKey, 'Private key is required'),
        childProvider
      )
      const rec = new ParentTransactionReceipt(
        await parentProvider.getTransactionReceipt(tx)
      )

      const events = await rec.getParentToChildMessages(childSigner)
      if (events.length !== 1) {
        throw new Error(`Expected 1 event, got ${events.length}`)
      }

      const event = events[0]
      const redemptionTx = await event.redeem()
      console.log('Redemption tx:', redemptionTx.hash)
      await redemptionTx.wait()
      console.log('Redemption tx confirmed')
    })
}
