import { spawn } from 'child_process'

export interface ExecuteCommandOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
  shell?: boolean | string
}

export interface CommandResult {
  code: number
  stdout: string
  stderr: string
}

/**
 * Executes a shell command and returns the result while preserving color output
 * @param command The command to execute
 * @param args Array of arguments for the command
 * @param options Optional execution options
 * @returns Promise that resolves with the command result
 */
export function executeCommand(
  command: string,
  args: string[] = [],
  options: ExecuteCommandOptions = {}
): Promise<number> {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      ...options.env,
    }

    // Spawn the process with inherited stdio to preserve color
    const childProcess = spawn(command, args, {
      ...options,
      env,
      stdio: 'inherit',
    })

    // Handle process completion
    childProcess.on('close', code => {
      resolve(code ?? 0)
    })

    // Handle process errors
    childProcess.on('error', error => {
      reject(error)
    })
  })
}
