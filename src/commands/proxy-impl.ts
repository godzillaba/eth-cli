import { Command } from '@commander-js/extra-typings';
import { providers } from 'ethers';
import { assertDefined, getProxyImpl, wordToAddr } from '../utils/misc';
import { log } from '../utils/logger';

export function proxyImplCommand(program: Command) {
  program
    .command('proxy-impl')
    .description('Get the implementation of a proxy')
    .argument('<address>', 'Proxy address')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .action(async (addr: string, options) => {
      const provider = new providers.JsonRpcProvider(assertDefined(options.rpc, 'Please specify --rpc'));
      log.info(await getProxyImpl(provider, addr));
    });
}