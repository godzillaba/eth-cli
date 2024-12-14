import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger.ts'
import { providers, Wallet } from 'ethers'
import {
  ChildToParentMessageWriter,
  ChildTransactionReceipt,
} from '@arbitrum/sdk'
import { assertDefined } from '../utils/misc.ts'

export function withdrawCommand(program: Command) {
  program
    .command('withdraw')
    .description('Redeem a child to parent transaction')
    .argument('<TX_HASH>', 'Child chain txHash that initiated the withdrawal')
    .option(
      '-k, --key <KEY>',
      'Private key. If not given, $PRIVATE_KEY will be used'
    )
    .option('-c, --child-rpc <URL>', 'Child chain RPC URL')
    .option('-p, --parent-rpc <URL>', 'Parent chain RPC URL')
    .action(async (txHash: string, options) => {
      log.info(`Withdrawing tx ${txHash}`)

      const privateKey = assertDefined(
        options.key || process.env.PRIVATE_KEY,
        'Private key is required'
      )
      const childChainRpc = assertDefined(
        options.childRpc,
        'Child chain RPC URL is required'
      )
      const parentChainRpc = assertDefined(
        options.parentRpc,
        'Parent chain RPC URL is required'
      )

      const childProvider = new providers.JsonRpcProvider(childChainRpc)
      const parentProvider = new providers.JsonRpcProvider(parentChainRpc)
      const parentWallet = new Wallet(privateKey, parentProvider)

      const txReceipt = new ChildTransactionReceipt(
        assertDefined(
          await childProvider.getTransactionReceipt(txHash),
          `Could not find tx receipt for ${txHash}`
        )
      )

      const events = txReceipt.getChildToParentEvents()

      for (let i = 0; i < events.length; i++) {
        log.info(`Withdrawing event ${i + 1} of ${events.length}...`)
        const event = events[i]
        const writer = new ChildToParentMessageWriter(parentWallet, event)
        const tx = await writer.execute(childProvider)
        await tx.wait()
        log.info(
          `Withdrawn event ${i + 1} of ${events.length}. Tx hash: ${tx.hash}`
        )
      }
    })
}
