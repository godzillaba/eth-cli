import { providers, utils } from 'ethers'

const ARBOS_STATE_ADDRESS = '0xa4b05fffffffffffffffffffffffffffffffffff'
const CHAIN_CONFIG_SUBSPACE_KEY = utils.keccak256('0x07')

// ArbOS storage slot for offset `o` within a subspace: keccak256(subspaceKey ++ o[0:31])[0:31] ++ o[31]
function slot(subspaceKey: string, offset: number): string {
  const offsetBytes = utils.hexZeroPad(utils.hexlify(offset), 32)
  const page = utils.keccak256(
    utils.hexConcat([subspaceKey, utils.hexDataSlice(offsetBytes, 0, 31)])
  )
  return utils.hexConcat([
    utils.hexDataSlice(page, 0, 31),
    utils.hexDataSlice(offsetBytes, 31),
  ])
}

// Reads the serialized chain config stored in ArbOS state (absent on chains
// initialized before nitro stored it, e.g. ARB1 and Nova).
export async function getSerializedChainConfig(
  provider: providers.JsonRpcProvider
): Promise<string | undefined> {
  const getSlot = (offset: number) =>
    provider.getStorageAt(
      ARBOS_STATE_ADDRESS,
      slot(CHAIN_CONFIG_SUBSPACE_KEY, offset)
    )

  const length = Number(await getSlot(0))
  if (length === 0) return undefined

  const wordCount = Math.ceil(length / 32)
  const words = await Promise.all(
    Array.from({ length: wordCount }, (_, i) => getSlot(i + 1))
  )
  const lastWordBytes = length - 32 * (wordCount - 1)
  const bytes = utils.hexConcat([
    ...words.slice(0, -1),
    utils.hexDataSlice(words[wordCount - 1], 32 - lastWordBytes),
  ])
  return utils.toUtf8String(bytes)
}

export async function getInitialChainOwner(
  provider: providers.JsonRpcProvider
): Promise<string | undefined> {
  const config = await getSerializedChainConfig(provider)
  if (!config) return undefined
  const owner = JSON.parse(config).arbitrum?.InitialChainOwner
  return owner ? utils.getAddress(owner) : undefined
}
