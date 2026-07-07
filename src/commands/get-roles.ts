import { Command } from '@commander-js/extra-typings'
import { log } from '../utils/logger'
import { EventFragment, getAddress } from 'ethers/lib/utils'
import { getProxyImpl, loadAbiFromFile } from '../utils/misc'
import { Contract, ethers } from 'ethers'
import { getAbi } from '../utils/etherscan'
import { getLogsPaginated } from '../utils/get-logs'

export function getRolesCommand(program: Command) {
  program
    .command('get-roles')
    .description('Get roles for a contract')
    .argument('<ADDR>', 'Contract address')
    .option(
      '-p, --proxy',
      'Whether the contract is a proxy. Used to get the ABI to try to find role preimages'
    )
    .option('-r, --rpc <RPC>', 'RPC URL')
    .option('-a, --abi <PATH>', 'Path to ABI file (Foundry artifact, Hardhat artifact, or raw ABI JSON)')
    .action(async (addr, options) => {
      const provider = new ethers.providers.JsonRpcProvider(options.rpc)
      addr = getAddress(addr.toLowerCase())

      const abi = options.abi
        ? loadAbiFromFile(options.abi)
        : await getAbi(
            (await provider.getNetwork()).chainId,
            options.proxy ? await getProxyImpl(provider, addr) : addr
          )
      if (!abi) {
        log.error(`No ABI found for address ${addr}`)
        process.exit(1)
      }

      const iface = new ethers.utils.Interface(abi)

      let roleGrantedEvent: EventFragment | undefined;
      let roleRevokedEvent: EventFragment | undefined;
      try {
        roleGrantedEvent = iface.getEvent('RoleGranted')
        roleRevokedEvent = iface.getEvent('RoleRevoked')
      }
      catch {}

      if (!roleGrantedEvent || !roleRevokedEvent) {
        log.error(
          `No RoleGranted or RoleRevoked events found in ABI for address ${addr}. Try setting the --proxy flag if this is a proxy contract.`
        )
        process.exit(1)
      }

      // assumes the contract follows the norm of having roles as public functions
      const possibleRoleNames = new Map<string, string>()
      for (const func of abi) {
        if (func.type === 'function' &&
            func.inputs.length === 0 &&
            func.outputs.length === 1 &&
            func.outputs[0].type === 'bytes32') {
          possibleRoleNames.set(
            (await new Contract(addr, iface, provider).functions[func.name]())[0],
            func.name
          )
        }
      }

      const grantedEvents = await getLogsPaginated(provider, {
        address: addr,
        topics: [iface.getEventTopic(roleGrantedEvent)],
      })

      const revokedEvents = await getLogsPaginated(provider, {
        address: addr,
        topics: [iface.getEventTopic(roleRevokedEvent)],
      })

      const allEvents = [...grantedEvents, ...revokedEvents].sort(
        (a, b) => a.blockNumber - b.blockNumber
      )

      const roles: { [role: string]: Set<string> } = {}

      for (const event of allEvents) {
        const parsed = iface.parseLog(event)
        const role = parsed.args.role
        const account = parsed.args.account
        if (!roles[role]) {
          roles[role] = new Set()
        }
        if (parsed.name === 'RoleRevoked') {
          roles[role].delete(account)
        } else {
          roles[role].add(account)
        }
      }

      log.info(`Roles for contract ${addr}:`)
      for (const [role, accounts] of Object.entries(roles)) {
        log.info(`Role: ${role} ${possibleRoleNames.get(role) || ''}`)
        for (const account of accounts) {
          log.info(`  ${account}`)
        }
      }
    })
}
