import { Command } from '@commander-js/extra-typings';
import { log } from '../utils/logger.ts';
import { providers } from 'ethers';
import { getAbi } from '../utils/etherscan.ts';

export function etherscanAbiCommand(program: Command) {
  program
    .command('etherscan-abi')
    .description('Get ABI a contract')
    .argument('<address>', 'Ccontract address')
    .option('-c, --chain <CHAIN>', 'Chain ID')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .action(async (addr: string, options) => {
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

      log.info(await getAbi(chainId, addr));
    });
}
