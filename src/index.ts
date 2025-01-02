import { program } from '@commander-js/extra-typings'
import { withdrawCommand } from './commands/withdraw.ts'
import { etherscanCreationCommand } from './commands/es-creation.ts'
import { etherscanAbiCommand } from './commands/es-abi.ts'
import { proxyAdminCommand } from './commands/proxy-admin.ts'
import { proxyImplCommand } from './commands/proxy-impl.ts'
import { verifyBytecodeCommand } from './commands/verify-bytecode.ts'
import { zeroBytesCommand } from './commands/zb.ts'
import { toEtherCommand } from './commands/to-ether.ts'
import { aliasCommand } from './commands/alias.ts'

program.name('eth-cli').version('0.0.1')

// Register commands
withdrawCommand(program)
etherscanCreationCommand(program)
etherscanAbiCommand(program)
proxyAdminCommand(program)
proxyImplCommand(program)
verifyBytecodeCommand(program)
zeroBytesCommand(program)
toEtherCommand(program)
aliasCommand(program)

program.parse()
