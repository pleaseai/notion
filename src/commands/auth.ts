import type { OutputFormat } from '../utils/formatter.ts'
import { Command } from 'commander'
import { deleteConfig, loadConfig, saveConfig } from '../lib/config.ts'
import { handleNotionError } from '../lib/error-handler.ts'
import { validateToken } from '../lib/notion-client.ts'
import { output } from '../utils/formatter.ts'

/**
 * Create auth command group
 */
export function createAuthCommand(): Command {
  const auth = new Command('auth')
  auth.description('Manage Notion authentication')

  auth
    .command('login')
    .description('Authenticate with Notion integration token')
    .argument('[token]', 'Notion integration token')
    .action(async (token: string | undefined, command: Command) => {
      try {
        const format = getFormat(command)

        // Prompt for token if not provided
        let notionToken = token
        if (!notionToken) {
          console.error('Enter your Notion integration token:')
          console.error('(Get it from https://www.notion.so/my-integrations)')
          // Read from stdin
          // eslint-disable-next-line no-alert
          const input = prompt('Token: ')
          if (!input) {
            console.error('✗ Token is required')
            process.exit(1)
          }
          notionToken = input.trim()
        }

        // Validate token
        console.error('Validating token...')
        const isValid = await validateToken(notionToken)

        if (!isValid) {
          console.error('✗ Invalid token')
          console.error('  Make sure you copied the correct integration token.')
          console.error('  Get it from https://www.notion.so/my-integrations')
          process.exit(1)
        }

        // Save config
        saveConfig({ notionToken })

        output(
          {
            status: 'success',
            message: 'Successfully authenticated',
          },
          format,
        )
      }
      catch (error) {
        handleNotionError(error, 'Authentication', { operation: 'login' })
      }
    })

  auth
    .command('logout')
    .description('Remove authentication credentials')
    .action((command: Command) => {
      const format = getFormat(command)

      const config = loadConfig()
      if (!config?.notionToken) {
        output(
          {
            status: 'info',
            message: 'Not authenticated',
          },
          format,
        )
        return
      }

      deleteConfig()

      output(
        {
          status: 'success',
          message: 'Successfully logged out',
        },
        format,
      )
    })

  auth
    .command('status')
    .description('Check authentication status')
    .action(async (command: Command) => {
      try {
        const format = getFormat(command)

        const config = loadConfig()
        if (!config?.notionToken) {
          output(
            {
              authenticated: false,
              message: 'Not authenticated. Run "notion auth login" to authenticate.',
            },
            format,
          )
          return
        }

        // Verify token is still valid
        const isValid = await validateToken(config.notionToken)

        if (isValid) {
          output(
            {
              authenticated: true,
              message: 'Authenticated',
            },
            format,
          )
        }
        else {
          output(
            {
              authenticated: false,
              message: 'Token is invalid or expired. Run "notion auth login" to re-authenticate.',
            },
            format,
          )
        }
      }
      catch (error) {
        handleNotionError(error, 'Status check', { operation: 'status' })
      }
    })

  return auth
}

/**
 * Get output format from parent command
 */
function getFormat(command: Command): OutputFormat {
  return (command.parent?.parent?.opts()?.format || 'toon') as OutputFormat
}
