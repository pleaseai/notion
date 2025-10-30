#!/usr/bin/env bun
import { Command } from 'commander'
import packageJson from '../package.json'
import { createAuthCommand } from './commands/auth.ts'
import { createDatabaseCommand } from './commands/database.ts'
import { createPageCommand } from './commands/page.ts'

/**
 * Main CLI program
 */
const program = new Command()

program
  .name('notion')
  .description('Notion CLI - Manage Notion from the command line')
  .version(packageJson.version)
  .option(
    '-f, --format <type>',
    'Output format: toon (token-efficient for LLMs), json (for scripting), plain (human-readable)',
    'toon',
  )

// Register command groups
program.addCommand(createAuthCommand())
program.addCommand(createPageCommand())
program.addCommand(createDatabaseCommand())

// Parse arguments
program.parse(process.argv)

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
