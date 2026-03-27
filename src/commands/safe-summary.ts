import { Command } from '@commander-js/extra-typings'
import { Contract, providers } from 'ethers'
import { wordToAddr } from '../utils/misc'
import { log } from '../utils/logger'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

const FALLBACK_HANDLER_SLOT =
  '0x6c9a6c4a39284e37ed1cf53d337577d14212a4870fb976a4366c693b939918d5'
const GUARD_SLOT =
  '0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8'
const MODULE_GUARD_SLOT =
  '0xb104e0b93118902c651344349b610029d694cfdec91c589c91ebafbcd0289947'

const SAFE_ABI = [
  'function VERSION() view returns (string)',
  'function getOwners() view returns (address[])',
  'function getThreshold() view returns (uint256)',
  'function nonce() view returns (uint256)',
  'function getModulesPaginated(address start, uint256 pageSize) view returns (address[] array, address next)',
]

const SENTINEL = '0x0000000000000000000000000000000000000001'

export function safeSummaryCommand(program: Command) {
  program
    .command('safe-summary')
    .description('Get summary info for a Gnosis Safe')
    .argument('<SAFE>', 'Safe address')
    .requiredOption('-r, --rpc <RPC_URL>', 'RPC URL')
    .action(async (safe: string, options) => {
      const provider = new providers.JsonRpcProvider(options.rpc)
      const contract = new Contract(safe, SAFE_ABI, provider)

      const [version, owners, threshold, nonce, [modules], singleton, fallback, guard, moduleGuard] =
        await Promise.all([
          contract.VERSION(),
          contract.getOwners(),
          contract.getThreshold(),
          contract.nonce(),
          contract.getModulesPaginated(SENTINEL, 100),
          provider.getStorageAt(safe, '0x0').then(wordToAddr),
          provider.getStorageAt(safe, FALLBACK_HANDLER_SLOT).then(wordToAddr),
          provider.getStorageAt(safe, GUARD_SLOT).then(wordToAddr),
          provider.getStorageAt(safe, MODULE_GUARD_SLOT).then(wordToAddr),
        ])

      log.info(`Safe: ${safe}`)
      log.info(`Version: ${version}`)
      log.info(`Singleton: ${singleton}`)
      log.info(`Nonce: ${nonce}`)
      log.info(`Threshold: ${threshold}/${owners.length}`)
      log.info('Owners:')
      for (const owner of owners) log.info(`  ${owner}`)
      log.info('Modules:')
      if (modules.length === 0) {
        log.info('  none')
      } else {
        for (const mod of modules) log.info(`  ${mod}`)
      }
      log.info(`Fallback Handler: ${fallback === ZERO_ADDR ? 'none' : fallback}`)
      log.info(`Transaction Guard: ${guard === ZERO_ADDR ? 'none' : guard}`)
      log.info(`Module Guard: ${moduleGuard === ZERO_ADDR ? 'none' : moduleGuard}`)
    })
}
