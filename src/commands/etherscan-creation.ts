import { Command } from '@commander-js/extra-typings';
import { log } from '../utils/logger.ts';
import { providers } from 'ethers';
import { getContractCreation } from '../utils/etherscan.ts';

export function etherscanCreationCommand(program: Command) {
  program
    .command('etherscan-contract-creation')
    .description('Get information about contract creation transactions')
    .argument('<addresses>', 'Comma-separated list of contract addresses')
    .option('-c, --chain <CHAIN>', 'Chain ID')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .action(async (addrs: string, options) => {
      if (!options.chain && !options.rpc) {
        log.error('Please specify --chain or --rpc');
        process.exit(1);
      }

      let chainId: number;
      if (options.chain) {
        chainId = parseInt(options.chain);
      } else {
        const provider = new providers.JsonRpcProvider(options.rpc);
        chainId = (await provider.getNetwork()).chainId;
      }

      log.info(JSON.stringify(await getContractCreation(chainId, addrs.split(',')), null, 2));
    });
}
