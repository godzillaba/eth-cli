import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger.ts'
import { providers } from 'ethers'
import { getContractCreation } from '../utils/etherscan.ts'
import { defaultAbiCoder, getAddress, getContractAddress } from 'ethers/lib/utils'
import { getProxyImpl } from '../utils/misc.ts'

function getContractName(artifact: any) {
  if (artifact.contractName) {
    return artifact.contractName
  }
  const target = Object.values(artifact.metadata.settings.compilationTarget)[0]
  return target
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

export function verifyBytecodeCommand(program: Command) {
  program
    .command('verify-bytecode')
    .description('Verify contract bytecode')
    .argument('<ADDRESS>', 'Ccontract address')
    .argument('<ARTIFACT_FILE>', 'Path to the build artifact file')
    .option('-r, --rpc <RPC>', 'RPC URL')
    .option('-p, --proxy', 'Verify the proxy implementation bytecode. Will not verify the proxy itself')
    .action(async (addr: string, artifactFile: string, options) => {
      const provider = new providers.JsonRpcProvider(options.rpc)

      const artifact = require(artifactFile)
      log.info(`Contract Name: ${getContractName(artifact)}`)

      addr = getAddress(addr)

      if (options.proxy) {
        const proxyAddr = addr;
        addr = await getProxyImpl(provider, addr)
        log.info(`Proxy Address: ${proxyAddr}`)
        log.info(`Implementation Address: ${addr}`)
      }
      else {
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
      const creationTxHash = (await getContractCreation(chainId, [addr]))[0].txHash;
      if (!creationTxHash) {
        throw new Error('Creation transaction not found')
      }
      const tx = await provider.getTransaction(creationTxHash)
      log.info(`Creation transaction: ${creationTxHash}`)

      // make sure it is a creation tx
      if (tx.to) {
        throw new Error('Not a creation transaction')
      }

      // make sure the resulting contract address is the same as the one we are verifying
      if (getContractAddress(tx) !== addr) {
        throw new Error(`Contract address mismatch. Expected ${addr}, got ${getContractAddress(tx)}`)
      }

      // make sure the artifact bytecode is a prefix of the tx input data
      const artifactBytecode = getBytecode(artifact)
      if (!tx.data.startsWith(artifactBytecode)) {
        log.error('Bytecode mismatch')
        process.exit(1)
      }

      // decode the constructor arguments and display them
      const constructorAbi = artifact.abi.find((abi: any) => abi.type === 'constructor');
      const decoded = defaultAbiCoder.decode(constructorAbi.inputs, '0x' + tx.data.slice(artifactBytecode.length))
      log.info('Constructor arguments:')
      for (let i = 0; i < constructorAbi.inputs.length; i++) {
        log.info(`${constructorAbi.inputs[i].type} ${constructorAbi.inputs[i].name}:\n  ${decoded[i]}`)
      }

      log.success('Bytecode verified')
    })
}
