import { spawn } from 'child_process'

export interface ExecuteCommandOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
  shell?: boolean | string
}

export function executeCommand(
  command: string,
  args: string[] = [],
  options: ExecuteCommandOptions = {}
): Promise<number> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      ...options,
      env: { ...process.env, ...options.env },
      stdio: 'inherit',
    })

    childProcess.on('close', code => resolve(code ?? 0))
    childProcess.on('error', error => reject(error))
  })
}
