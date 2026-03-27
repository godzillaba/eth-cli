import { Command } from '@commander-js/extra-typings'
import { Interface } from 'ethers/lib/utils'
import { providers } from 'ethers'
import { assertDefined, OUTBOXES } from '../utils/misc'
import { executeCommand } from '../utils/spawn'

export function outboxSimCommand(program: Command) {
  program
    .command('outbox-sim')
    .description('Simulate a withdrawal')
    .argument('<CHILD_TX>', 'Withdrawal tx on child')
    .option('-p, --parent-rpc <PARENT_RPC>', 'Parent RPC URL')
    .option('-c, --child-rpc <CHILD_RPC>', 'Child RPC URL')
    .option(
      '-o, --outbox <OUTBOX>',
      'Outbox address (not required unless child is unknown)'
    )
    .action(async (tx, options) => {
      const childProvider = new providers.JsonRpcProvider(
        assertDefined(options.childRpc, 'Child RPC URL is required')
      )

      const outbox =
        options.outbox || OUTBOXES[(await childProvider.getNetwork()).chainId]
      if (!outbox) {
        throw new Error('Outbox address is required')
      }

      const iface = new Interface([
        // arbsys
        'event L2ToL1Tx(address caller,address indexed destination,uint256 indexed hash,uint256 indexed position,uint256 arbBlockNum,uint256 ethBlockNum,uint256 timestamp,uint256 callvalue,bytes data)',
        // outbox
        'function executeTransactionSimulation(uint256 index,address l2Sender,address to,uint256 l2Block,uint256 l1Block,uint256 l2Timestamp,uint256 value,bytes calldata data)',
      ])
      const rec = await childProvider.getTransactionReceipt(tx)

      const logs = rec.logs
        .filter(log => log.topics[0] === iface.getEventTopic('L2ToL1Tx'))
        .map(log => iface.parseLog(log))

      if (logs.length !== 1) {
        throw new Error(`Expected 1 log, got ${logs.length}`)
      }

      const log = logs[0]

      // build the calldata
      const calldata = iface.encodeFunctionData(
        'executeTransactionSimulation',
        [
          log.args.position,
          log.args.caller,
          log.args.destination,
          log.args.arbBlockNum,
          log.args.ethBlockNum,
          log.args.timestamp,
          log.args.callvalue,
          log.args.data,
        ]
      )

      const cmd = 'cast'
      const args =
        `call --trace ${outbox} ${calldata} -r ${assertDefined(options.parentRpc, 'Parent RPC Required')}`.split(
          ' '
        )
      // run the command
      await executeCommand(cmd.split(' ')[0], args)
    })
}
