import { Command } from '@commander-js/extra-typings'
import { utils } from 'ethers'

export function rlpDecodeCommand(program: Command) {
  program
    .command('rlp-decode')
    .argument('<RLP_ENCODED_HEX>', 'RLP encoded hex string')
    .action(async (rlp) => {
      console.log(utils.RLP.decode(rlp))
    })
}
