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
import { getFeeCollectorsCommand } from './commands/fee-collectors.ts'
import { rdRecipientsCommand } from './commands/rd-recipients.ts'
import { outboxSimCommand } from './commands/outbox-sim.ts'
import { getNitroAddressesCommand } from './commands/get-nitro-addresses.ts'
import { safeTxHashCommand } from './commands/safe-tx-hash.ts'
import { outboxRedeemCommand } from './commands/outbox-redeem.ts'
import { retryableRedeemCommand } from './commands/retryable-redeem.ts'
import { depositTokenCommand } from './commands/deposit-token.ts'
import { getRolesCommand } from './commands/get-roles.ts'
import { rlpDecodeCommand } from './commands/rlp-decode.ts'
import { deployTestTokenCommand } from './commands/deploy-test-token.ts'
import { sendSafeTxCommand } from './commands/send-safe-tx.ts'

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
getFeeCollectorsCommand(program)
rdRecipientsCommand(program)
outboxSimCommand(program)
getNitroAddressesCommand(program)
safeTxHashCommand(program)
outboxRedeemCommand(program)
retryableRedeemCommand(program)
depositTokenCommand(program)
getRolesCommand(program)
rlpDecodeCommand(program)
deployTestTokenCommand(program)
sendSafeTxCommand(program)

program.parse()
