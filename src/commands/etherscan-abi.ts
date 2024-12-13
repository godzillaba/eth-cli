import { Command } from '@commander-js/extra-typings';
import { log } from '../utils/logger.ts';
import { providers } from 'ethers';
import { getAbi } from '../utils/etherscan.ts';
import { assertDefined, getProxyAddress } from '../utils/misc.ts';

export function etherscanAbiCommand(program: Command) {
  program
    .command('etherscan-abi')
    .description('Get ABI a contract')
    .argument('<address>', 'Ccontract address')
    .option('-p, --proxy', 'Get the proxy implementation ABI')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .action(async (addr: string, options) => {
      const provider = new providers.JsonRpcProvider(assertDefined(options.rpc, 'Please specify --rpc'));
      const chainId = (await provider.getNetwork()).chainId;
      addr = options.proxy ? await getProxyAddress(provider, addr) : addr;
      log.info(await getAbi(chainId, addr));
    });
}
