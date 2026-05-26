import { assertDefined } from './misc'

function getApiKeyFromEnv() {
  return assertDefined(
    process.env.ETHERSCAN_API_KEY,
    `ETHERSCAN_API_KEY not set`
  )
}

function getEtherscanUrl(chainId: number) {
  return `https://api.etherscan.io/v2/api?chainid=${chainId}&`
}

async function hitApiEndpoint(chainId: number, query: string) {
  const apiKey = getApiKeyFromEnv()
  const url = getEtherscanUrl(chainId)
  const response = await fetch(`${url}${query}&apikey=${apiKey}`)
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
  const res = (
    await hitApiEndpoint(
      chainId,
      `module=contract&action=getsourcecode&address=${addr}`
    )
  )[0].ABI

  return typeof res === 'string' ? JSON.parse(res) : res
}

export async function getSourceCode(chainId: number, addr: string) {
  return (
    await hitApiEndpoint(
      chainId,
      `module=contract&action=getsourcecode&address=${addr}`
    )
  )[0]
}

export async function getContractName(chainId: number, addr: string) {
  return (await getSourceCode(chainId, addr)).ContractName
}
