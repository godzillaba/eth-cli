import { program } from '@commander-js/extra-typings'
import { withdrawCommand } from './commands/withdraw.ts'
import { etherscanCreationCommand } from './commands/es-creation.ts'
import { etherscanAbiCommand } from './commands/es-abi.ts'
import { etherscanNameCommand } from './commands/es-name.ts'
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
import { trackDepositCommand } from './commands/track-deposit.ts'
import { depositTokenCommand } from './commands/deposit-token.ts'
import { getRolesCommand } from './commands/get-roles.ts'
import { rlpDecodeCommand } from './commands/rlp-decode.ts'
import { deployTestTokenCommand } from './commands/deploy-test-token.ts'
import { sendSafeTxCommand } from './commands/send-safe-tx.ts'
import { completionCommand } from './commands/completion.ts'
import { chainOwnersCommand } from './commands/chain-owners.ts'
import { safeSummaryCommand } from './commands/safe-summary.ts'
import { rcImplementationsCommand } from './commands/rc-implementations.ts'
import { rcDecodeCommand } from './commands/rc-decode.ts'

program.name('esk').version('0.0.1')

// Register commands
withdrawCommand(program)
etherscanCreationCommand(program)
etherscanAbiCommand(program)
etherscanNameCommand(program)
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
trackDepositCommand(program)
depositTokenCommand(program)
getRolesCommand(program)
rlpDecodeCommand(program)
deployTestTokenCommand(program)
sendSafeTxCommand(program)
completionCommand(program)
chainOwnersCommand(program)
safeSummaryCommand(program)
rcImplementationsCommand(program)
rcDecodeCommand(program)

program.parse()
