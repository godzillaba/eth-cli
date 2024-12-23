import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger.ts'
import { providers } from 'ethers'
import { getContractCreation } from '../utils/etherscan.ts'

export function etherscanCreationCommand(program: Command) {
  program
    .command('es-creation')
    .description(
      'Get information about contract creation transactions from etherscan'
    )
    .argument('<ADDRESS>', 'Ccontract address')
    .option('-c, --chain <CHAIN>', 'Chain ID')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .action(async (addr: string, options) => {
      let chainId: number
      if (options.chain) {
        chainId = parseInt(options.chain)
      } else {
        const provider = new providers.JsonRpcProvider(options.rpc)
        chainId = (await provider.getNetwork()).chainId
      }

      log.info(
        JSON.stringify((await getContractCreation(chainId, [addr]))[0], null, 2)
      )
    })
}
