import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger.ts'
import { providers } from 'ethers'
import { getContractCreation } from '../utils/etherscan.ts'
import {
  defaultAbiCoder,
  getAddress,
  getContractAddress,
  type Result,
} from 'ethers/lib/utils'
import { extractMetadata, getProxyImpl } from '../utils/misc.ts'
import { promises as fs } from 'fs'

function getContractName(artifact: any) {
  if (artifact.contractName) {
    return artifact.contractName
  }
  const target = artifact.metadata?.settings?.compilationTarget
  if (target) {
    return Object.values(target)[0]
  }
  return 'Unknown'
}

function getBytecode(artifact: any) {
  if (typeof artifact.bytecode === 'string') {
    return artifact.bytecode
  }
  if (typeof artifact.bytecode.object === 'string') {
    return artifact.bytecode.object
  }

  throw new Error('Cannot find bytecode')
}

function getDeployedBytecode(artifact: any) {
  if (typeof artifact.deployedBytecode === 'string') {
    return artifact.deployedBytecode
  }
  if (typeof artifact.deployedBytecode.object === 'string') {
    return artifact.deployedBytecode.object
  }

  throw new Error('Cannot find deployed bytecode')
}

// todo: create2 factories
function getDeploymentBytecodeAndAddress(tx: providers.TransactionResponse) {
  if (!tx.to) {
    return {
      bytecode: tx.data,
      address: getContractAddress(tx),
    }
  } else {
    throw new Error('Not a creation transaction')
  }
}

function prettifyInput(inputAbi: any, result: Result, leadingTabs: number) {
  if (inputAbi.internalType.startsWith('struct')) {
    // we are printing a struct
    let res = `${'    '.repeat(leadingTabs)}${inputAbi.internalType} ${inputAbi.name}:\n`
    for (let i = 0; i < inputAbi.components.length; i++) {
      res +=
        prettifyInput(inputAbi.components[i], result[i], leadingTabs + 1) + '\n'
    }
    return res.slice(0, -1)
  } else {
    // we're printing elementary
    return `${'    '.repeat(leadingTabs)}${inputAbi.internalType} ${inputAbi.name}: ${result}`
  }
}

export function verifyBytecodeCommand(program: Command) {
  program
    .command('verify-bytecode')
    .description('Verify contract bytecode')
    .argument('<ADDRESS>', 'Ccontract address')
    .argument('<ARTIFACT_FILE>', 'Path to the build artifact file')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .option(
      '-p, --proxy',
      'Verify the proxy implementation bytecode. Will not verify the proxy itself'
    )
    .action(async (addr: string, artifactFile: string, options) => {
      const provider = new providers.JsonRpcProvider(options.rpc)

      const artifact = JSON.parse((await fs.readFile(artifactFile)).toString())
      log.info(`Contract Name: ${getContractName(artifact)}`)

      addr = getAddress(addr)

      if (options.proxy) {
        const proxyAddr = addr
        addr = await getProxyImpl(provider, addr)
        log.info(`Proxy Address: ${proxyAddr}`)
        log.info(`Implementation Address: ${addr}`)
      } else {
        log.info(`Contract Address: ${addr}`)
      }

      // steps:
      // - get the creation tx
      // - make sure it is a creation tx
      // - make sure the resulting contract address is the same as the one we are verifying
      // - make sure the artifact bytecode is a prefix of the tx input data
      // - decode the constructor arguments and display them

      // get the creation tx
      const chainId = (await provider.getNetwork()).chainId
      const creationTxHash = (await getContractCreation(chainId, [addr]))[0]
        .txHash
      if (!creationTxHash) {
        throw new Error('Creation transaction not found')
      }
      const tx = await provider.getTransaction(creationTxHash)
      log.info(`Creation transaction: ${creationTxHash}`)

      // make sure the resulting contract address is the same as the one we are verifying
      // and get the deployment bytecode
      const { bytecode, address } = getDeploymentBytecodeAndAddress(tx)
      if (address !== addr) {
        throw new Error('Address mismatch')
      }

      // make sure the artifact bytecode is a prefix of the deployment bytecode
      const artifactBytecode = getBytecode(artifact)
      let fullVerification = false
      if (bytecode.startsWith(artifactBytecode)) {
        fullVerification = true
      } else {
        // try partial verification

        // get artifact metadata
        const artifactMetadata = extractMetadata(getDeployedBytecode(artifact))
        // get onchain metadata. use the deployed bytecode, not the tx data
        const onchainMetadata = extractMetadata(await provider.getCode(addr))

        // remove metadata from both and compare
        const artifactBytecodeNoMetadata = artifactBytecode.replace(
          artifactMetadata,
          ''
        )
        const bytecodeNoMetadata = bytecode.replace(onchainMetadata, '')

        if (!bytecodeNoMetadata.startsWith(artifactBytecodeNoMetadata)) {
          log.error('Bytecode mismatch')
          process.exit(1)
        }
      }

      // decode the constructor arguments and display them
      const constructorAbi = artifact.abi?.find(
        (abi: any) => abi.type === 'constructor'
      )
      if (constructorAbi && constructorAbi.inputs) {
        const decoded = defaultAbiCoder.decode(
          constructorAbi.inputs,
          '0x' + bytecode.slice(artifactBytecode.length)
        )
        log.info('Constructor arguments:')
        for (let i = 0; i < constructorAbi.inputs.length; i++) {
          log.info(prettifyInput(constructorAbi.inputs[i], decoded[i], 1))
        }
      }

      log.success(
        fullVerification
          ? 'Bytecode verified'
          : 'Bytecode verified (excluding metadata)'
      )
    })
}
