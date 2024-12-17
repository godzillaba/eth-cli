import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger'
import { formatEther } from 'ethers/lib/utils'

export function toEtherCommand(program: Command) {
  program
    .command('to-eth')
    .description('Convert wei into ether')
    .argument('[WEI]', 'Wei amount. Default reads from stdin')
    .action(async (wei: string | undefined) => {
      if (!wei) {
        wei = await new Promise<string>(resolve => {
          process.stdin.on('data', data => {
            resolve(data.toString().trim())
          })
        })
      }

      log.info(formatEther(wei))
    })
}
