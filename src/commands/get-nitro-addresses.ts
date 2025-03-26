import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger'
import { providers } from 'ethers'
import { getAllContractsFromInbox } from '../utils/nitro-contracts-utils'

export function getNitroAddressesCommand(program: Command) {
  program
    .command('get-nitro-addresses')
    .description('Get L1 nitro contract addresses given an inbox')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .argument('<INBOX>', 'Inbox address')
    .action(async (inbox, options) => {
      const provider = new providers.JsonRpcProvider(options.rpc)
      const addrs = await getAllContractsFromInbox(provider, inbox)
      log.info(JSON.stringify(addrs, null, 2))
    })
}
