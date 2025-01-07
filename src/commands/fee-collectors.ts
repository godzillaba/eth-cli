import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger'
import { providers } from 'ethers'
import {
  getBatchPosters,
  getL1BaseFeeCollector,
  getL1SurplusFeeCollector,
  getL2BaseFeeCollector,
} from '../utils/arb-precompiles'
import {
  getRewardDistributorRecipients,
  isRewardDistributor,
} from '../utils/reward-distributor'

export function getFeeCollectorsCommand(program: Command) {
  program
    .command('fee-collectors')
    .description('Get fee collectors and batch posters of a chain.')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .option('-d, --distributor', 'Show RewardDistributor recipients')
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
      str += `L1 Surplus Collector: ${l1SurplusCollector} ${await extraRdInfo(l1SurplusCollector, tab)}`
      str += `\nL2 Base Collector: ${l2BaseCollector} ${await extraRdInfo(l2BaseCollector, tab)}`
      str += `\nL2 Surplus Collector: ${l2SurplusCollector} ${await extraRdInfo(l2SurplusCollector, tab)}`
      str += `\nBatch Posters -> L1 Base Collector:`
      for (let i = 0; i < posters.length; i++) {
        str += `\n${tab}${posters[i]} -> ${l1BaseCollectors[i]} ${await extraRdInfo(l1SurplusCollector, tab + tab)}`
      }
      log.info(str)

      async function extraRdInfo(addr: string, prefix: string) {
        if (
          !options.distributor ||
          !(await isRewardDistributor(addr, provider))
        )
          return ''
        const d = await getRewardDistributorRecipients(addr, provider)
        return `(RD):\n${d.recipients.map((r, i) => `${prefix}${r}: ${d.weights[i].toNumber() / 100}%`).join('\n')}`
      }
    })
}
