import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger'
import { providers, utils } from 'ethers'

const ARB_OWNER = '0x0000000000000000000000000000000000000070'
const EVENT_TOPIC =
  '0x3c9e6a772755407311e3b35b3ee56799df8f87395941b3a658eee9e08a67ebda'
const ADD_CHAIN_OWNER =
  '0x481f8dbf00000000000000000000000000000000000000000000000000000000'
const REMOVE_CHAIN_OWNER =
  '0x8792701a00000000000000000000000000000000000000000000000000000000'

export function chainOwnersCommand(program: Command) {
  program
    .command('chain-owners')
    .description('Get chain owners from ArbOwner precompile events.')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .action(async options => {
      const provider = new providers.JsonRpcProvider(options.rpc)

      const [addLogs, removeLogs] = await Promise.all([
        provider.getLogs({
          address: ARB_OWNER,
          topics: [EVENT_TOPIC, ADD_CHAIN_OWNER],
          fromBlock: 0,
        }),
        provider.getLogs({
          address: ARB_OWNER,
          topics: [EVENT_TOPIC, REMOVE_CHAIN_OWNER],
          fromBlock: 0,
        }),
      ])

      const events = [...addLogs, ...removeLogs].sort(
        (a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex
      )

      const owners = new Set<string>()
      for (const event of events) {
        const [calldata] = utils.defaultAbiCoder.decode(['bytes'], event.data)
        const [address] = utils.defaultAbiCoder.decode(
          ['address'],
          utils.hexDataSlice(calldata, 4)
        )

        if (event.topics[1] === ADD_CHAIN_OWNER) {
          owners.add(address)
        } else {
          owners.delete(address)
        }
      }

      if (owners.size === 0) {
        log.warning('No chain owners found')
        return
      }

      log.info('Chain Owners:')
      Array.from(owners).forEach(owner => log.info(`  ${owner}`))
    })
}
