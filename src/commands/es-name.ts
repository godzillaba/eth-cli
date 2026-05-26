import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger.ts'
import { providers } from 'ethers'
import { getContractName } from '../utils/etherscan.ts'
import { getProxyImpl } from '../utils/misc.ts'

export function etherscanNameCommand(program: Command) {
  program
    .command('es-name')
    .description('Get the name of a contract from etherscan')
    .argument('<ADDRESS>', 'Contract address')
    .option('-p, --proxy', 'Get the proxy implementation name')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .action(async (addr: string, options) => {
      const provider = new providers.JsonRpcProvider(options.rpc)
      const chainId = (await provider.getNetwork()).chainId
      addr = options.proxy ? await getProxyImpl(provider, addr) : addr
      log.info(await getContractName(chainId, addr))
    })
}
