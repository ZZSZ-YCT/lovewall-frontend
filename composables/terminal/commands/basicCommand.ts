import { useCli } from "~/composables/terminal/useCli";

const { register } = useCli()

export function registerBasicCommands() {
  register({
    name: 'echo',
    summary: 'Echo text',
    args: [{ name: 'text', variadic: true }],
    options: [
      { name: 'upper', short: 'u', type: 'boolean', description: 'Uppercase output' }
    ],
    action: ({ println, parsed }) => {
      const s = (parsed.argv as string[]).join(' ')
      println(parsed.options.upper ? s.toUpperCase() : s)
    }
  })

  register({
    name: 'clear',
    summary: 'Clear terminal',
    action: ({ clear }) => {
      clear()
    }
  })

  register({
    name: 'ls',
    summary: 'List directory contents',
    action: ({ println }) => {
      println("We don't have a filesystem here. :)")
    }
  })

  register({
    name: 'date',
    summary: 'Show date/time',
    options: [
      { name: 'format', short: 'f', type: 'enum', choices: ['iso', 'locale'], default: 'iso', description: 'Output format' }
    ],
    action: ({ println, parsed }) => {
      const now = new Date()
      println(parsed.options.format === 'locale' ? now.toString() : now.toISOString())
    }
  })
}
