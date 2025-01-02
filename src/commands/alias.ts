import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger'
import { getAddress } from 'ethers/lib/utils'
import { ADDRESS_ALIAS_OFFSET } from '@arbitrum/sdk/dist/lib/dataEntities/constants'

export function aliasCommand(program: Command) {
  program
    .command('alias')
    .description('Alias (or dealias) an address')
    .argument('<ADDR>', 'Address to alias or dealias')
    .option('-d, --dealias', 'Dealias the address')
    .action(async (addr, options) => {
      addr = getAddress(addr.toLowerCase())
      const asBigint = BigInt(addr)
      const offset = BigInt(ADDRESS_ALIAS_OFFSET)
      const result = options.dealias ? asBigint - offset : asBigint + offset
      const maskedResult = result & ((1n << 160n) - 1n)
      log.info(
        `Resulting address: ${getAddress(maskedResult.toString(16).padStart(40, '0'))}`
      )
    })
}
