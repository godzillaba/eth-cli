import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger'
import { providers } from 'ethers'
import {
  getBatchPosters,
  getL1BaseFeeCollector,
  getL1SurplusFeeCollector,
  getL2BaseFeeCollector,
} from '../utils/arb-precompiles'

export function getFeeCollectorsCommand(program: Command) {
  program
    .command('get-fee-collectors')
    .description('Get fee collectors and batch posters of a chain.')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .action(async options => {
      const provider = new providers.JsonRpcProvider(options.rpc)
      const tab = '  '
      const posters = await getBatchPosters(provider)
      const l1BaseCollectors = await Promise.all(
        posters.map(poster => getL1BaseFeeCollector(provider, poster))
      )
      const l1SurplusCollector = await getL1SurplusFeeCollector(provider)
      const l2BaseCollector = await getL2BaseFeeCollector(provider)
      const l2SurplusCollector = await getL1SurplusFeeCollector(provider)

      let str = ''
      str += `L1 Surplus Collector: ${l1SurplusCollector}`
      str += `\nL2 Base Collector: ${l2BaseCollector}`
      str += `\nL2 Surplus Collector: ${l2SurplusCollector}`
      str += `\nBatch Posters -> L1 Base Collector:\n${tab}`
      str += posters
        .map((poster, i) => `${poster} -> ${l1BaseCollectors[i]}`)
        .join(`\n${tab}`)
      log.info(str)
    })
}
