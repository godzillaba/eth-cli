import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger.ts'
import { providers } from 'ethers'
import { getAbi } from '../utils/etherscan.ts'
import { getProxyImpl } from '../utils/misc.ts'
import { Interface } from 'ethers/lib/utils'

export function etherscanAbiCommand(program: Command) {
  program
    .command('etherscan-abi')
    .description('Get ABI a contract')
    .argument('<ADDRESS>', 'Ccontract address')
    .option('-p, --proxy', 'Get the proxy implementation ABI')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .option('-i, --interface', 'Pretty print as a solidity interface')
    .action(async (addr: string, options) => {
      const provider = new providers.JsonRpcProvider(options.rpc)
      const chainId = (await provider.getNetwork()).chainId
      addr = options.proxy ? await getProxyImpl(provider, addr) : addr
      const abi = await getAbi(chainId, addr)

      if (options.interface) {
        const iface = new Interface(abi)
        let str = 'interface Contract {\n'
        for (const fn of iface.fragments) {
          str += `    ${fn.format('full')};\n`
        }
        log.info(str + '}')
      } else {
        log.info(abi)
      }
    })
}
