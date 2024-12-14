import chalk from 'chalk'

export const log = {
  info: (message: string) => console.log(message),
  success: (message: string) => console.log(chalk.greenBright(message)),
  warning: (message: string) => console.log(chalk.yellowBright(message)),
  error: (message: string) => console.log(chalk.redBright(message)),
}
