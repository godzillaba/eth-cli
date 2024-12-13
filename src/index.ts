import { program } from '@commander-js/extra-typings';
import { withdrawCommand } from './commands/withdraw.ts';

program
  .name('eth-cli')
  .version('0.0.1');

// Register commands
withdrawCommand(program);

program.parse();