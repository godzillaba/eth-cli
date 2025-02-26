import { assertDefined } from './misc'

function getApiKeyFromEnv(chainId: number) {
  const envNames: { [k: number]: string } = {
    1: 'ETHERSCAN_API_KEY',
    42161: 'ARBISCAN_API_KEY',
    421614: 'ARBISCAN_API_KEY',
    42170: 'NOVASCAN_API_KEY',
    8453: 'BASESCAN_API_KEY',
    84532: 'BASESCAN_API_KEY',
  }

  return assertDefined(
    process.env[envNames[chainId]] || process.env.ETHERSCAN_API_KEY,
    `API key for chain ${chainId} not found in env. Please set ${envNames[chainId]}, ETHERSCAN_API_KEY, or pass it as an argument`
  )
}

function getEtherscanUrl(chainId: number) {
  const urls: { [k: number]: string } = {
    1: 'https://api.etherscan.io/api',
    42161: 'https://api.arbiscan.io/api',
    42170: 'https://api-nova.arbiscan.io/api',
    421614: 'https://api-sepolia.arbiscan.io/api',
    11155111: 'https://api-sepolia.etherscan.io/api',
    17000: 'https://api-holesky.etherscan.io/api',
    8453: 'https://api.basescan.org/api',
    84532: 'https://api-sepolia.basescan.org/api',
  }
  return assertDefined(
    urls[chainId],
    `Etherscan URL for chain ${chainId} not found`
  )
}

async function hitApiEndpoint(chainId: number, query: string) {
  const apiKey = getApiKeyFromEnv(chainId)
  const url = getEtherscanUrl(chainId)
  const response = await fetch(`${url}?${query}&apikey=${apiKey}`)
  const json = await response.json()
  if (!json.result) {
    throw new Error(`${url}?${query}\n${JSON.stringify(json)}`)
  }
  return json.result
}

export async function getContractCreation(chainId: number, addrs: string[]) {
  return hitApiEndpoint(
    chainId,
    `module=contract&action=getcontractcreation&contractaddresses=${addrs.join(',')}`
  )
}

export async function getAbi(chainId: number, addr: string) {
  return (
    await hitApiEndpoint(
      chainId,
      `module=contract&action=getsourcecode&address=${addr}`
    )
  )[0].ABI
}

export async function getSourceCode(chainId: number, addr: string) {
  return (
    await hitApiEndpoint(
      chainId,
      `module=contract&action=getsourcecode&address=${addr}`
    )
  )[0]
}
