import { Command } from '@commander-js/extra-typings'
import { ethers, providers, Wallet } from 'ethers'
import { assertDefined } from '../utils/misc'
import artifact from '../abi/MyToken.json'
import { AbiCoder } from 'ethers/lib/utils'

export function deployTestTokenCommand(program: Command) {
  program
    .command('deploy-test-token')
    .description('Deploy an owner minted ERC20Votes token')
    .argument('<NAME>', 'Token name')
    .argument('<SYMBOL>', 'Token symbol')
    .option('-r, --rpc-url <RPC_URL>', 'RPC URL')
    .option(
      '-k, --private-key <PRIVATE_KEY>',
      'Private key to sign the transaction'
    )
    .action(async (name, symbol, options) => {
      const provider = new providers.JsonRpcProvider(
        assertDefined(options.rpcUrl, 'RPC URL is required')
      )
      const wallet = new Wallet(
        assertDefined(options.privateKey, 'Private key is required'),
        provider
      )

      const bytecode = artifact.bytecode.object
      const deploymentData = ethers.utils.concat([
        bytecode,
        new AbiCoder().encode(['string', 'string'], [name, symbol]),
      ])

      const tx = await wallet.sendTransaction({
        data: deploymentData
      })

      console.log(`Deployment transaction sent: ${tx.hash}`)

      const receipt = await tx.wait()
      console.log(`Contract deployed at address: ${receipt.contractAddress}`)
    })
}
