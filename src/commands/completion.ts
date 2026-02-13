import { Command } from '@commander-js/extra-typings'

interface OptionInfo {
  flag: string
  description: string
}

interface CommandInfo {
  name: string
  description: string
  options: OptionInfo[]
}

function getCommands(program: Command): CommandInfo[] {
  return program.commands.map((cmd) => ({
    name: cmd.name(),
    description: cmd.description(),
    options: cmd.options
      .map((o) => ({
        flag: (o.long ?? o.short) as string,
        description: o.description,
      }))
      .filter((o) => o.flag),
  }))
}

function escSingleQuote(s: string): string {
  return s.replace(/'/g, "'\\''")
}

function generateBash(commands: CommandInfo[]): string {
  const names = commands.map((c) => c.name).join(' ')
  const optionCases = commands
    .filter((c) => c.options.length > 0)
    .map(
      (c) =>
        `        ${c.name})\n            COMPREPLY=($(compgen -W "${c.options.map((o) => o.flag).join(' ')}" -- "$cur"))\n            ;;`
    )
    .join('\n')

  return `# esk bash completion
# Add to ~/.bashrc or ~/.bash_profile:
#   eval "$(esk completion bash)"
_esk() {
    local cur="\${COMP_WORDS[COMP_CWORD]}"
    local cmd="\${COMP_WORDS[1]}"

    if [ "\$COMP_CWORD" -eq 1 ]; then
        COMPREPLY=($(compgen -W "${names}" -- "$cur"))
        return
    fi

    case "$cmd" in
${optionCases}
    esac
}
complete -F _esk esk`
}

function generateZsh(commands: CommandInfo[]): string {
  const entries = commands
    .map((c) => `        '${c.name}:${escSingleQuote(c.description)}'`)
    .join('\n')

  const subcmdCases = commands
    .filter((c) => c.options.length > 0)
    .map((c) => {
      const opts = c.options
        .map((o) => `'${o.flag}[${escSingleQuote(o.description)}]'`)
        .join(' ')
      return `            ${c.name})\n                _arguments ${opts}\n                ;;`
    })
    .join('\n')

  return `#compdef esk
# Add to ~/.zshrc:
#   eval "$(esk completion zsh)"
# Or save to a file in your fpath:
#   esk completion zsh > ~/.zfunc/_esk
_esk() {
    local -a commands
    commands=(
${entries}
    )

    _arguments '1:command:->cmds' '*::arg:->args'

    case $state in
        cmds)
            _describe 'command' commands
            ;;
        args)
            local cmd="\${words[1]}"
            case "$cmd" in
${subcmdCases}
            esac
            ;;
    esac
}
compdef _esk esk`
}

export function completionCommand(program: Command) {
  program
    .command('completion')
    .description('Generate shell completion scripts')
    .argument('<shell>', 'Shell type: bash or zsh')
    .action((shell: string) => {
      const commands = getCommands(program)

      switch (shell) {
        case 'bash':
          console.log(generateBash(commands))
          break
        case 'zsh':
          console.log(generateZsh(commands))
          break
        default:
          console.error(`Unsupported shell: ${shell}. Supported: bash, zsh`)
          process.exit(1)
      }
    })
}
