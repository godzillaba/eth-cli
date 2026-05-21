import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger'
import { BigNumber, providers } from 'ethers'
import {
  getBatchPosters,
  getL1BaseFeeCollector,
  getL1SurplusFeeCollector,
  getL2BaseFeeCollector,
  getL2SurplusFeeCollector,
} from '../utils/arb-precompiles'
import { getRewardDistributorRecipients } from '../utils/reward-distributor'

export function getFeeCollectorsCommand(program: Command) {
  program
    .command('fee-collectors')
    .description('Get fee collectors and batch posters of a chain.')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .option('-d, --distributor', 'Show RewardDistributor recipients')
    .action(async options => {
      const provider = new providers.JsonRpcProvider(options.rpc)
      const tab = '  '

      const [posters, l1Surplus, l2Base, l2Surplus] = await Promise.all([
        (async () => {
          const posters = await getBatchPosters(provider)
          const l1BaseCollectorsAndRdInfo = await Promise.all(
            posters.map(poster =>
              getRdData(getL1BaseFeeCollector(provider, poster))
            )
          )
          return {
            posters,
            collectors: l1BaseCollectorsAndRdInfo.map(x => x.collector),
            rdDatas: l1BaseCollectorsAndRdInfo.map(x => x.rdData),
          }
        })(),
        getRdData(getL1SurplusFeeCollector(provider)),
        getRdData(getL2BaseFeeCollector(provider)),
        getRdData(getL2SurplusFeeCollector(provider)),
      ])
      async function getRdData(collectorPromise: Promise<string>) {
        const collector = await collectorPromise
        return {
          collector,
          rdData: options.distributor
            ? await getRewardDistributorRecipients(collector, provider)
            : null,
        }
      }
      function fmtRdData(
        rdData: { recipients: string[]; weights: BigNumber[] } | null,
        prefix: string
      ) {
        return rdData
          ? `(RD):\n${rdData.recipients.map((r, i) => `${prefix}${r}: ${rdData.weights[i].toNumber() / 100}%`).join('\n')}`
          : ''
      }

      let str = ''
      str += `L2 Base Collector: ${l2Base.collector} ${fmtRdData(l2Base.rdData, tab)}`
      str += `\nL2 Surplus Collector: ${l2Surplus.collector} ${fmtRdData(l2Surplus.rdData, tab)}`
      str += `\nL1 Surplus Collector: ${l1Surplus.collector} ${fmtRdData(l1Surplus.rdData, tab)}`
      str += `\nBatch Posters -> L1 Base Collector:`
      for (let i = 0; i < posters.posters.length; i++) {
        str += `\n${tab}${posters.posters[i]} -> ${posters.collectors[i]} ${fmtRdData(posters.rdDatas[i], tab + tab)}`
      }

      log.info(str)
    })
}
