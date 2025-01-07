import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger.ts'
import { providers } from 'ethers'
import { getRewardDistributorRecipients } from '../utils/reward-distributor.ts'

export function rdRecipientsCommand(program: Command) {
  program
    .command('rd-recipients')
    .description('Get recipients of a RewardDistributor')
    .argument('<ADDRESS>', 'RewardDistributor address')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .action(async (addr: string, options) => {
      const provider = new providers.JsonRpcProvider(options.rpc)
      const data = await getRewardDistributorRecipients(addr, provider)

      log.info(
        `${data.recipients.map((r, i) => `${r}: ${data.weights[i].toNumber() / 100}%`)}`
      )
    })
}
