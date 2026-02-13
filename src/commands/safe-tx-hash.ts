import { Command } from '@commander-js/extra-typings'
import { domainSeparator, safeTxHash, safeTransactionHash, decodeMultiSend, type SafeTxParams } from '../utils/safe'

export function safeTxHashCommand(program: Command) {
  program
    .command('safe-tx-hash')
    .description('Generate Safe Tx Hash')
    .argument('<SAFE>')
    .argument('<CHAIN_ID>')
    .argument('<TO>')
    .argument('<VALUE>')
    .argument('<DATA>')
    .argument('<NONCE>')
    .option(
      '-o, --operation <OP>',
      'Operation type (0: call, 1: delegatecall)',
      '0'
    )
    .option('-s, --safe-tx-gas <GAS>', 'Safe tx gas', '0')
    .option('-b, --base-gas <GAS>', 'Base gas', '0')
    .option('-g, --gas-price <PRICE>', 'Gas price', '0')
    .option(
      '-t, --gas-token <TOKEN>',
      'Gas token',
      '0x0000000000000000000000000000000000000000'
    )
    .option(
      '-r, --refund-receiver <RECEIVER>',
      'Refund receiver',
      '0x0000000000000000000000000000000000000000'
    )
    .action(async (safe, chainId, to, value, data, nonce, options) => {
      const params: SafeTxParams = {
        safe, chainId, to, value, data, nonce,
        operation: options.operation,
        safeTxGas: options.safeTxGas,
        baseGas: options.baseGas,
        gasPrice: options.gasPrice,
        gasToken: options.gasToken,
        refundReceiver: options.refundReceiver,
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
    })
}
