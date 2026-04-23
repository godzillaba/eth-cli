import { Command } from '@commander-js/extra-typings'
import { Contract, providers } from 'ethers'
import { log } from '../utils/logger'

const rollupCreatorAbi = [
  'function bridgeCreator() view returns (address)',
  'function osp() view returns (address)',
  'function challengeManagerTemplate() view returns (address)',
  'function rollupAdminLogic() view returns (address)',
  'function rollupUserLogic() view returns (address)',
  'function upgradeExecutorLogic() view returns (address)',
  'function validatorWalletCreator() view returns (address)',
  'function l2FactoriesDeployer() view returns (address)',
]

const bridgeCreatorAbi = [
  'function ethBasedTemplates() view returns (address, address, address, address, address, address)',
  'function erc20BasedTemplates() view returns (address, address, address, address, address, address)',
]

const templateFields = [
  'bridge',
  'sequencerInbox',
  'delayBufferableSequencerInbox',
  'inbox',
  'rollupEventInbox',
  'outbox',
] as const

function toTemplatesObj(tuple: string[]) {
  return Object.fromEntries(templateFields.map((f, i) => [f, tuple[i]]))
}

export function rcImplementationsCommand(program: Command) {
  program
    .command('rc-implementations')
    .description(
      'Get all implementation/template addresses from a deployed RollupCreator'
    )
    .argument('<ROLLUP_CREATOR>', 'RollupCreator address')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .action(async (rollupCreatorAddr, options) => {
      const provider = new providers.JsonRpcProvider(options.rpc)
      const rc = new Contract(rollupCreatorAddr, rollupCreatorAbi, provider)

      const [
        bridgeCreatorAddr,
        osp,
        challengeManagerTemplate,
        rollupAdminLogic,
        rollupUserLogic,
        upgradeExecutorLogic,
        validatorWalletCreator,
        l2FactoriesDeployer,
      ] = await Promise.all([
        rc.bridgeCreator(),
        rc.osp(),
        rc.challengeManagerTemplate(),
        rc.rollupAdminLogic(),
        rc.rollupUserLogic(),
        rc.upgradeExecutorLogic(),
        rc.validatorWalletCreator(),
        rc.l2FactoriesDeployer(),
      ])

      const bc = new Contract(bridgeCreatorAddr, bridgeCreatorAbi, provider)
      const [ethTemplates, erc20Templates] = await Promise.all([
        bc.ethBasedTemplates(),
        bc.erc20BasedTemplates(),
      ])

      log.info(
        JSON.stringify(
          {
            bridgeCreator: bridgeCreatorAddr,
            osp,
            challengeManagerTemplate,
            rollupAdminLogic,
            rollupUserLogic,
            upgradeExecutorLogic,
            validatorWalletCreator,
            l2FactoriesDeployer,
            ethBasedTemplates: toTemplatesObj(ethTemplates),
            erc20BasedTemplates: toTemplatesObj(erc20Templates),
          },
          null,
          2
        )
      )
    })
}
