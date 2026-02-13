import { Command } from '@commander-js/extra-typings'
import { constants, ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { domainSeparator, safeTxHash, safeTransactionHash, decodeMultiSend, type SafeTxParams } from '../utils/safe'

export function sendSafeTxCommand(program: Command) {
  program
    .command('send-safe-tx')
    .description('Send Safe Tx (1of1 safe)')
    .argument('<SAFE>')
    .argument('<TO>')
    .argument('<VALUE>')
    .argument('<DATA>')
    .option(
      '-o, --operation <OP>',
      'Operation type (0: call, 1: delegatecall)',
      '0'
    )
    .requiredOption(
      '-r, --rpc-url <RPC_URL>',
    )
    .action(async (safe, to, value, data, options) => {
      const walletPrivateKey = process.env.SAFE_WALLET_PRIVATE_KEY
      const senderPrivateKey = process.env.SENDER_PRIVATE_KEY

      if (!walletPrivateKey) {
        throw new Error('SAFE_WALLET_PRIVATE_KEY env var not set')
      }
      if (!senderPrivateKey) {
        throw new Error('SENDER_PRIVATE_KEY env var not set')
      }

      const provider = new ethers.providers.JsonRpcProvider(options.rpcUrl)
      const chainId = (await provider.getNetwork()).chainId
      const safeNonce = await provider.call({
        to: safe,
        data: '0xaffed0e0', // nonce()
      })

      const params: SafeTxParams = {
        safe, chainId, to, value, data,
        operation: options.operation,
        safeTxGas: 0n,
        baseGas: 0n,
        gasPrice: 0n,
        gasToken: constants.AddressZero,
        refundReceiver: constants.AddressZero,
        nonce: safeNonce,
      }

      console.log('Domain Hash:', domainSeparator(chainId, safe))
      console.log('Message Hash:', safeTxHash(params))
      console.log('Tx hash:', safeTransactionHash(params))

      const multiSendTxs = decodeMultiSend(to, options.operation, data)
      if (multiSendTxs) {
        console.log('MultiSend transactions:')
        for (const tx of multiSendTxs) {
          console.log(`  - To: ${tx.to}, Value: ${tx.value}, Data: ${tx.data}`)
        }
      }

      const walletSigner = new ethers.Wallet(walletPrivateKey, provider)
      const senderSigner = new ethers.Wallet(senderPrivateKey, provider)

      const txHash = safeTransactionHash(params)
      const signature = walletSigner._signingKey().signDigest(txHash)

      const tx = await senderSigner.sendTransaction({
        to: safe,
        data: new Interface([
          'function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) returns (bool success)',
        ]).encodeFunctionData('execTransaction', [
          to,
          value,
          data,
          options.operation,
          0,
          0,
          0,
          constants.AddressZero,
          constants.AddressZero,
          ethers.utils.joinSignature(signature),
        ]),
      })

      console.log('Transaction sent. Hash:', tx.hash)
      await tx.wait()
      console.log('Transaction confirmed.')
    })
}
