import { Command } from '@commander-js/extra-typings'
import { ethers } from 'ethers'

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
    .option('-d, --dealias', 'Dealias the address')
    .action(async (safe, chainId, to, value, data, nonce, options) => {
      const DOMAIN_SEPARATOR_TYPEHASH =
        '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218'
      const SAFE_TX_TYPEHASH =
        '0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8'
      const abiCoder = new ethers.utils.AbiCoder()

      function domainSeparator() {
        return ethers.utils.keccak256(
          abiCoder.encode(
            ['bytes32', 'uint256', 'address'],
            [DOMAIN_SEPARATOR_TYPEHASH, chainId, safe]
          )
        )
      }

      function safeTxHash() {
        return ethers.utils.keccak256(
          abiCoder.encode(
            [
              'bytes32',
              'address',
              'uint256',
              'bytes32',
              'uint8',
              'uint256',
              'uint256',
              'uint256',
              'address',
              'address',
              'uint256',
            ],
            [
              SAFE_TX_TYPEHASH,
              to,
              value,
              ethers.utils.keccak256(data),
              options.operation,
              options.safeTxGas,
              options.baseGas,
              options.gasPrice,
              options.gasToken,
              options.refundReceiver,
              nonce,
            ]
          )
        )
      }

      function encodeTransactionData() {
        // return abi.encodePacked(bytes1(0x19), bytes1(0x01), domainSeparator(), safeTxHash);
        return ethers.utils.concat(['0x1901', domainSeparator(), safeTxHash()])
      }

      function getTransactionHash() {
        return ethers.utils.keccak256(encodeTransactionData())
      }

      console.log('Domain Hash:', domainSeparator())
      console.log('Message Hash:', safeTxHash())
      console.log('Tx hash:', getTransactionHash())
    })
}
