import { Command } from '@commander-js/extra-typings'
import { providers } from 'ethers'
import { wordToAddr } from '../utils/misc'
import { log } from '../utils/logger'

const PROXY_ADMIN_SLOT =
  '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'

export function proxyAdminCommand(program: Command) {
  program
    .command('proxy-admin')
    .description('Get the admin of a proxy')
    .argument('<ADDRESS>', 'Proxy address')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .action(async (addr: string, options) => {
      const provider = new providers.JsonRpcProvider(options.rpc)
      const slotVal = await provider.getStorageAt(addr, PROXY_ADMIN_SLOT)
      log.info(wordToAddr(slotVal))
    })
}
