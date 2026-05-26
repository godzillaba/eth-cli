import { assertDefined } from './misc'

const BLOCKSCOUT_INSTANCES: { [chainId: number]: string } = {
  42170: 'https://arbitrum-nova.blockscout.com',
}

function getApiUrl(chainId: number) {
  const blockscout = BLOCKSCOUT_INSTANCES[chainId]
  if (blockscout) {
    return `${blockscout}/api?`
  }
  const apiKey = assertDefined(
    process.env.ETHERSCAN_API_KEY,
    `ETHERSCAN_API_KEY not set`
  )
  return `https://api.etherscan.io/v2/api?chainid=${chainId}&apikey=${apiKey}&`
}

async function hitApiEndpoint(chainId: number, query: string) {
  const url = `${getApiUrl(chainId)}${query}`
  const response = await fetch(url)
  const json = await response.json()
  if (!json.result) {
    throw new Error(`${url}\n${JSON.stringify(json)}`)
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
