import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger'
import { getAddress } from 'ethers/lib/utils'
import { ADDRESS_ALIAS_OFFSET } from '@arbitrum/sdk/dist/lib/dataEntities/constants'
import { Erc20Bridger, getArbitrumNetwork } from '@arbitrum/sdk'
import { assertDefined } from '../utils/misc'
import { BigNumber, providers, Wallet } from 'ethers'

export function depositTokenCommand(program: Command) {
  program
    .command('deposit-token')
    .description('Deposit tokens to Arbitrum Chain')
    .argument('<TOKEN>', 'L1 token address')
    .argument('<AMOUNT>', 'Amount to deposit')
    .option('-t, --to <TO>', 'Recipient address')
    .option('-p, --parent-rpc <PARENT_RPC>', 'Parent RPC URL')
    .option('-c, --child-rpc <CHILD_RPC>', 'Child RPC URL')
    .option('-k, --private-key <PRIVATE_KEY>', 'Private key to sign the transaction')
    .option('-f, --from <FROM>', 'Sender address')
    .action(async (token, amount, options) => {
      if (!options.privateKey && !options.from) {
        throw new Error('Either private key or from address is required')
      }

      const childProvider = new providers.JsonRpcProvider(
        assertDefined(options.childRpc, 'Child RPC URL is required')
      )
      const parentProvider = new providers.JsonRpcProvider(
        assertDefined(options.parentRpc, 'Parent RPC URL is required')
      )

      const parentSigner = options.privateKey ? new Wallet(options.privateKey, parentProvider) : null

      const childChainId = (await childProvider.getNetwork()).chainId
      const bridger = new Erc20Bridger(getArbitrumNetwork(childChainId))

      const from = await parentSigner?.getAddress() || getAddress(options.from!)

      const approvalRequest = await bridger.getApproveTokenRequest({
        erc20ParentAddress: getAddress(token),
        amount: BigNumber.from(amount),
        parentProvider,
      })

      console.log(approvalRequest)

      const request = await bridger.getDepositRequest({
        erc20ParentAddress: getAddress(token),
        amount: BigNumber.from(amount),
        destinationAddress: options.to || from,
        childProvider,
        parentProvider,
        from
      })

      console.log(request)
    })
}
