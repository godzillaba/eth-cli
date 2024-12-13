import { program } from '@commander-js/extra-typings';
import { withdrawCommand } from './commands/withdraw.ts';
import { etherscanCreationCommand } from './commands/etherscan-creation.ts';
import { etherscanAbiCommand } from './commands/etherscan-abi.ts';

program
  .name('eth-cli')
  .version('0.0.1');

// Register commands
withdrawCommand(program);
etherscanCreationCommand(program);
etherscanAbiCommand(program);

program.parse();