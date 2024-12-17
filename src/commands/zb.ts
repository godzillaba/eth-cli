import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger'

export function zeroBytesCommand(program: Command) {
  program
    .command('zb')
    .description('Get some number of zero bytes')
    .argument('[NUM_BYTES]', 'Number of zero bytes to get', '32')
    .action(async (numBytes: string) => {
      const n = parseInt(numBytes)
      if (n < 0) {
        log.error('Number of bytes must be non-negative')
        process.exit(1)
      }
      const zeroBytes = '0x' + '00'.repeat(n)
      log.info(zeroBytes)
    })
}
