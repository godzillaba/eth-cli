import { Command } from '@commander-js/extra-typings';
import { log } from '../utils/logger.ts';
import { providers, Wallet } from 'ethers';
import { ChildToParentMessageWriter, ChildTransactionReceipt } from '@arbitrum/sdk';

export function withdrawCommand(program: Command) {
  program
    .command('withdraw')
    .description('Redeem a child to parent transaction')
    .argument('<txHash>', 'Child chain txHash that initiated the withdrawal')
    .option('-k, --key <KEY>', 'Private key. If not given, $PRIVATE_KEY will be used')
    .option('-c, --child-rpc <URL>', 'Child chain RPC URL')
    .option('-p, --parent-rpc <URL>', 'Parent chain RPC URL')
    .option('-i, --index <INDEX>', 'If the child chain tx made multiple withdrawals, specify the index of the withdrawal to redeem')
    .option('-a, --all', 'Redeem all withdrawals made by the child chain tx. Mutually exclusive with --index')
    .action(async (txHash: string, options) => {
      log.info(`Withdrawing tx ${txHash}`);

      if (options.all && options.index) {
        log.error('Cannot use --all and --index together');
        process.exit(1);
      }

      const privateKey = assertDefined(options.key || process.env.PRIVATE_KEY, 'Private key is required');
      const childChainRpc = assertDefined(options.childRpc, 'Child chain RPC URL is required');
      const parentChainRpc = assertDefined(options.parentRpc, 'Parent chain RPC URL is required');

      const childProvider = new providers.JsonRpcProvider(childChainRpc);
      const parentProvider = new providers.JsonRpcProvider(parentChainRpc);
      const parentWallet = new Wallet(privateKey, parentProvider);

      const txReceipt = new ChildTransactionReceipt(assertDefined(await childProvider.getTransactionReceipt(txHash), `Could not find tx receipt for ${txHash}`));

      const events = txReceipt.getChildToParentEvents();

      if (events.length === 0) {
        log.error('No child to parent events found');
        process.exit(1);
      }
      else if (events.length > 1 && options.index === undefined && options.all === undefined) {
        log.error('Multiple child to parent events found. Please specify --index or --all');
        process.exit(1);
      }
      else {
        const eventsToUse = options.all ? events : [events[parseInt(options.index || '0')]];
        for (let i = 0; i < eventsToUse.length; i++) {
          log.info(`Withdrawing event ${i + 1} of ${eventsToUse.length}`);
          const event = eventsToUse[i];
          const writer = new ChildToParentMessageWriter(parentWallet, event);
          const tx = await writer.execute(childProvider);
          await tx.wait();
          log.info(`Withdrawn event ${i + 1} of ${eventsToUse.length}. Tx hash: ${tx.hash}`);
        }
      }
    });
}

function assertDefined<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) {
    log.error(message);
    process.exit(1);
  }
  return value;
}
