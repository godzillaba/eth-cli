import { Command } from '@commander-js/extra-typings'
import { providers, Wallet } from 'ethers'
import { assertDefined } from '../utils/misc'
import {
  ChildToParentMessageWriter,
  ChildTransactionReceipt,
} from '@arbitrum/sdk'

export function outboxRedeemCommand(program: Command) {
  program
    .command('outbox-redeem')
    .description('Redeem a withdrawal')
    .argument('<CHILD_TX>', 'Withdrawal tx on child')
    .option('-p, --parent-rpc <PARENT_RPC>', 'Parent RPC URL')
    .option('-c, --child-rpc <CHILD_RPC>', 'Child RPC URL')
    .option(
      '-k, --private-key <PRIVATE_KEY>',
      'Private key to sign the transaction'
    )
    .option(
      '-o, --outbox <OUTBOX>',
      'Outbox address (not required unless child is unknown)'
    )
    .action(async (tx, options) => {
      const parentSigner = new Wallet(
        assertDefined(options.privateKey, 'Private key is required'),
        new providers.JsonRpcProvider(
          assertDefined(options.parentRpc, 'Parent RPC URL is required')
        )
      )
      const childProvider = new providers.JsonRpcProvider(
        assertDefined(options.childRpc, 'Child RPC URL is required')
      )

      const rec = new ChildTransactionReceipt(
        await childProvider.getTransactionReceipt(tx)
      )
      const events = rec.getChildToParentEvents()
      if (events.length !== 1) {
        throw new Error(`Expected 1 event, got ${events.length}`)
      }
      const event = events[0]

      const writer = new ChildToParentMessageWriter(parentSigner, event)

      const redemptionTx = await writer.execute(childProvider)
      console.log('Redemption tx:', redemptionTx.hash)
      await redemptionTx.wait()
      console.log('Redemption tx confirmed')
    })
}
