import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger'
import { Contract, providers } from 'ethers'
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
    .option('-c, --routers', 'Detect ChildToParentRewardRouters')
    .action(async options => {
      const provider = new providers.JsonRpcProvider(options.rpc)
      const tab = '  '

      async function getRouterTarget(addr: string): Promise<string | null> {
        if (!options.routers) return null
        try {
          return await new Contract(
            addr,
            ['function parentChainTarget() view returns (address)'],
            provider
          ).parentChainTarget()
        } catch {
          return null
        }
      }

      async function getCollectorData(collectorPromise: Promise<string>) {
        const collector = await collectorPromise
        const rdData = options.distributor
          ? await getRewardDistributorRecipients(collector, provider)
          : null
        const [routerTarget, recipientTargets] = await Promise.all([
          getRouterTarget(collector),
          Promise.all((rdData?.recipients ?? []).map(getRouterTarget)),
        ])
        return { collector, rdData, routerTarget, recipientTargets }
      }

      const [posters, l1Surplus, l2Base, l2Surplus] = await Promise.all([
        (async () => {
          const posters = await getBatchPosters(provider)
          const collectorData = await Promise.all(
            posters.map(poster =>
              getCollectorData(getL1BaseFeeCollector(provider, poster))
            )
          )
          return { posters, collectorData }
        })(),
        getCollectorData(getL1SurplusFeeCollector(provider)),
        getCollectorData(getL2BaseFeeCollector(provider)),
        getCollectorData(getL2SurplusFeeCollector(provider)),
      ])

      function fmtRouter(target: string | null) {
        return target ? ` (C2PRouter -> ${target})` : ''
      }
      function fmtCollector(
        data: Awaited<ReturnType<typeof getCollectorData>>,
        prefix: string
      ) {
        const { collector, rdData, routerTarget, recipientTargets } = data
        let str = `${collector}${fmtRouter(routerTarget)}`
        if (rdData) {
          str += ` (RD owned by ${rdData.owner}):\n${rdData.recipients.map((r, i) => `${prefix}${r}: ${rdData.weights[i].toNumber() / 100}%${fmtRouter(recipientTargets[i])}`).join('\n')}`
        }
        return str
      }

      let str = ''
      str += `L2 Base Collector: ${fmtCollector(l2Base, tab)}`
      str += `\nL2 Surplus Collector: ${fmtCollector(l2Surplus, tab)}`
      str += `\nL1 Surplus Collector: ${fmtCollector(l1Surplus, tab)}`
      str += `\nBatch Posters -> L1 Base Collector:`
      for (let i = 0; i < posters.posters.length; i++) {
        str += `\n${tab}${posters.posters[i]} -> ${fmtCollector(posters.collectorData[i], tab + tab)}`
      }

      log.info(str)
    })
}
