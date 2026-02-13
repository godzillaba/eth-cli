import { Command } from '@commander-js/extra-typings'
import { constants, ethers } from 'ethers'
import { getAddress, hexDataLength, hexDataSlice, Interface } from 'ethers/lib/utils'

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
      const DOMAIN_SEPARATOR_TYPEHASH =
        '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218'
      const SAFE_TX_TYPEHASH =
        '0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8'
      const abiCoder = new ethers.utils.AbiCoder()

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
              0n,
              0n,
              0n,
              constants.AddressZero,
              constants.AddressZero,
              safeNonce,
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

      if (
        getAddress(to) ===
          getAddress('0x40A2aCCbd92BCA938b02010E17A5b8929b49130D') &&
        options.operation === '1'
      ) {
        // this is a delegatecall to MultiSendCallOnly, decode for convenience
        const iface = new ethers.utils.Interface([
          'function multiSend(bytes memory transactions)',
        ])
        const decodedData = iface.decodeFunctionData('multiSend', data)[0]
        console.log('MultiSend transactions:')

        let op: number = 0
        let to: string = ''
        let value: bigint = 0n
        let dataLength: number = 0
        let txData: string = ''

        let i = 0
        while (i < hexDataLength(decodedData)) {
          op = parseInt(hexDataSlice(decodedData, i, i + 1), 16)
          i += 1
          to = getAddress(hexDataSlice(decodedData, i, i + 20))
          i += 20
          value = BigInt(hexDataSlice(decodedData, i, i + 32))
          i += 32
          dataLength = parseInt(hexDataSlice(decodedData, i, i + 32), 16)
          i += 32
          txData = hexDataSlice(decodedData, i, i + dataLength)
          i += dataLength
          if (op !== 0) {
            throw new Error(`Unknown version: ${op}`)
          }
          console.log(`  - To: ${to}, Value: ${value}, Data: ${txData}`)
        }
      }

      // sign and send the transaction
      const walletSigner = new ethers.Wallet(walletPrivateKey, provider)
      const senderSigner = new ethers.Wallet(senderPrivateKey, provider)

      const signature = walletSigner._signingKey().signDigest(getTransactionHash())

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
