import { Command } from '@commander-js/extra-typings'
import { providers, utils, BigNumber } from 'ethers'
import { log } from '../utils/logger'

const MAX_TIME_VARIATION =
  'tuple(uint256 delayBlocks,uint256 futureBlocks,uint256 delaySeconds,uint256 futureSeconds)'

const BUFFER_CONFIG =
  'tuple(uint64 threshold,uint64 max,uint64 replenishRateInBasis)'

const GLOBAL_STATE = 'tuple(bytes32[2] bytes32Vals,uint64[2] u64Vals)'

const ASSERTION_STATE =
  `tuple(${GLOBAL_STATE} globalState,uint8 machineStatus,bytes32 endHistoryRoot)`

const CONFIG =
  'tuple(' +
  'uint64 confirmPeriodBlocks,' +
  'address stakeToken,' +
  'uint256 baseStake,' +
  'bytes32 wasmModuleRoot,' +
  'address owner,' +
  'address loserStakeEscrow,' +
  'uint256 chainId,' +
  'string chainConfig,' +
  'uint256 minimumAssertionPeriod,' +
  'uint64 validatorAfkBlocks,' +
  'uint256[] miniStakeValues,' +
  `${MAX_TIME_VARIATION} sequencerInboxMaxTimeVariation,` +
  'uint256 layerZeroBlockEdgeHeight,' +
  'uint256 layerZeroBigStepEdgeHeight,' +
  'uint256 layerZeroSmallStepEdgeHeight,' +
  `${ASSERTION_STATE} genesisAssertionState,` +
  'uint256 genesisInboxCount,' +
  'address anyTrustFastConfirmer,' +
  'uint8 numBigStepLevel,' +
  'uint64 challengeGracePeriodBlocks,' +
  `${BUFFER_CONFIG} bufferConfig,` +
  'uint256 dataCostEstimate' +
  ')'

const CREATE_ROLLUP_SIG =
  `function createRollup(tuple(${CONFIG} config,address[] validators,uint256 maxDataSize,address nativeToken,bool deployFactoriesToL2,uint256 maxFeePerGasForRetryables,address[] batchPosters,address batchPosterManager,address feeTokenPricer,address customOsp) deployParams) payable returns (address)`

const MACHINE_STATUS = ['RUNNING', 'FINISHED', 'ERRORED']

function decode(value: any, paramType: utils.ParamType): any {
  if (paramType.baseType === 'tuple' && paramType.components) {
    const obj: Record<string, any> = {}
    paramType.components.forEach((c, i) => {
      obj[c.name || `_${i}`] = decode(value[i], c)
    })
    return obj
  }
  if (paramType.baseType === 'array' || /\[\d*\]$/.test(paramType.type)) {
    return (value as any[]).map((v) => decode(v, paramType.arrayChildren))
  }
  if (BigNumber.isBigNumber(value)) return value.toString()
  return value
}

export function rcDecodeCommand(program: Command) {
  program
    .command('rc-decode')
    .description(
      'Decode a RollupCreator.createRollup call (nitro-contracts v3.2.0). ' +
        'Accepts a tx hash (requires --rpc) or raw hex calldata.'
    )
    .argument('<INPUT>', 'Tx hash (0x + 64 hex) or hex calldata')
    .option('-r, --rpc <RPC>', 'RPC URL (required if INPUT is a tx hash)')
    .action(async (input: string, options) => {
      const isTxHash = /^0x[0-9a-fA-F]{64}$/.test(input)

      let data: string
      let context: Record<string, string> = {}
      if (isTxHash) {
        if (!options.rpc) throw new Error('--rpc is required when INPUT is a tx hash')
        const provider = new providers.JsonRpcProvider(options.rpc)
        const tx = await provider.getTransaction(input)
        if (!tx) throw new Error(`Transaction ${input} not found`)
        data = tx.data
        context = {
          rollupCreator: tx.to ?? '',
          txHash: input,
          from: tx.from,
          value: tx.value.toString(),
        }
      } else {
        if (!/^0x[0-9a-fA-F]+$/.test(input)) {
          throw new Error('INPUT must be a 0x-prefixed hex tx hash or calldata')
        }
        data = input
      }

      const iface = new utils.Interface([CREATE_ROLLUP_SIG])
      const expected = iface.getSighash('createRollup')
      const actual = data.slice(0, 10)
      if (actual !== expected) {
        throw new Error(
          `Selector ${actual} does not match createRollup ${expected}. ` +
            `Input may not be a v3.2.0 RollupCreator.createRollup call.`
        )
      }

      const parsed = iface.parseTransaction({ data })
      const deployParams = decode(parsed.args[0], parsed.functionFragment.inputs[0])

      const ms = Number(deployParams.config.genesisAssertionState.machineStatus)
      deployParams.config.genesisAssertionState.machineStatus =
        `${ms} (${MACHINE_STATUS[ms] ?? 'UNKNOWN'})`

      log.info(JSON.stringify({ ...context, deployParams }, null, 2))
    })
}
