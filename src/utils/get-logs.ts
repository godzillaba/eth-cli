import type { providers } from 'ethers'

// Try the whole range in one request; on any error, split in half and recurse.
// A single-block failure can't be a size problem, so it rethrows.
export async function getLogsPaginated(
  provider: providers.JsonRpcProvider,
  filter: providers.Filter
): Promise<providers.Log[]> {
  const from = typeof filter.fromBlock === 'number' ? filter.fromBlock : 0
  const to =
    typeof filter.toBlock === 'number'
      ? filter.toBlock
      : await provider.getBlockNumber()
  return getRange(provider, filter, from, to)
}

async function getRange(
  provider: providers.JsonRpcProvider,
  filter: providers.Filter,
  from: number,
  to: number
): Promise<providers.Log[]> {
  try {
    return await provider.getLogs({ ...filter, fromBlock: from, toBlock: to })
  } catch (err) {
    if (from >= to) throw err
    const mid = Math.floor((from + to) / 2)
    return [
      ...(await getRange(provider, filter, from, mid)),
      ...(await getRange(provider, filter, mid + 1, to)),
    ]
  }
}
