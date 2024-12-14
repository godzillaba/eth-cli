import { Command } from '@commander-js/extra-typings'
import { providers } from 'ethers'
import { getProxyImpl } from '../utils/misc'
import { log } from '../utils/logger'

export function proxyImplCommand(program: Command) {
  program
    .command('proxy-impl')
    .description('Get the implementation of a proxy')
    .argument('<ADDRESS>', 'Proxy address')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .action(async (addr: string, options) => {
      log.info(
        await getProxyImpl(new providers.JsonRpcProvider(options.rpc), addr)
      )
    })
}
