import { ethers } from 'ethers'
import { getAddress, hexDataLength, hexDataSlice } from 'ethers/lib/utils'

const DOMAIN_SEPARATOR_TYPEHASH =
  '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218'
const SAFE_TX_TYPEHASH =
  '0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8'

const abiCoder = new ethers.utils.AbiCoder()

export interface SafeTxParams {
  safe: string
  chainId: number | string
  to: string
  value: string | number | bigint
  data: string
  operation: string | number
  safeTxGas: string | number | bigint
  baseGas: string | number | bigint
  gasPrice: string | number | bigint
  gasToken: string
  refundReceiver: string
  nonce: string | number | bigint
}

export function domainSeparator(chainId: number | string, safe: string) {
  return ethers.utils.keccak256(
    abiCoder.encode(
      ['bytes32', 'uint256', 'address'],
      [DOMAIN_SEPARATOR_TYPEHASH, chainId, safe]
    )
  )
}

export function safeTxHash(params: SafeTxParams) {
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
        params.to,
        params.value,
        ethers.utils.keccak256(params.data),
        params.operation,
        params.safeTxGas,
        params.baseGas,
        params.gasPrice,
        params.gasToken,
        params.refundReceiver,
        params.nonce,
      ]
    )
  )
}

export function safeTransactionHash(params: SafeTxParams) {
  return ethers.utils.keccak256(
    ethers.utils.concat([
      '0x1901',
      domainSeparator(params.chainId, params.safe),
      safeTxHash(params),
    ])
  )
}

const MULTISEND_ADDR = '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'

export function decodeMultiSend(to: string, operation: string, data: string) {
  if (getAddress(to) !== getAddress(MULTISEND_ADDR) || operation !== '1') {
    return null
  }

  const iface = new ethers.utils.Interface([
    'function multiSend(bytes memory transactions)',
  ])
  const decoded = iface.decodeFunctionData('multiSend', data)[0]
  const txs: { to: string; value: bigint; data: string }[] = []

  let i = 0
  while (i < hexDataLength(decoded)) {
    const op = parseInt(hexDataSlice(decoded, i, i + 1), 16)
    i += 1
    const txTo = getAddress(hexDataSlice(decoded, i, i + 20))
    i += 20
    const txValue = BigInt(hexDataSlice(decoded, i, i + 32))
    i += 32
    const dataLength = parseInt(hexDataSlice(decoded, i, i + 32), 16)
    i += 32
    const txData = hexDataSlice(decoded, i, i + dataLength)
    i += dataLength
    if (op !== 0) {
      throw new Error(`Unknown version: ${op}`)
    }
    txs.push({ to: txTo, value: txValue, data: txData })
  }

  return txs
}
