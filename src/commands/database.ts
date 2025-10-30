import { Command } from 'commander'
import { createNotionClient } from '../lib/notion-client.ts'
import { handleNotionError } from '../lib/error-handler.ts'
import type { OutputFormat } from '../utils/formatter.ts'
import { output } from '../utils/formatter.ts'

/**
 * Create database command group
 */
export function createDatabaseCommand(): Command {
  const database = new Command('database')
  database.description('Manage Notion databases')

  database
    .command('list')
    .description('List all accessible databases')
    .option('-l, --limit <number>', 'Maximum number of databases to return', '100')
    .action(async (options, command: Command) => {
      try {
        const format = getFormat(command)
        const limit = Number.parseInt(options.limit, 10)

        const notion = createNotionClient()

        // Search for databases
        const response = await notion.search({
          filter: { property: 'object', value: 'database' },
          page_size: Math.min(limit, 100),
        })

        const databases = response.results.map((db: any) => ({
          id: db.id,
          title: extractTitle(db),
          url: db.url,
          created_time: db.created_time,
          last_edited_time: db.last_edited_time,
          archived: db.archived,
        }))

        output({ databases, total: databases.length }, format)
      } catch (error) {
        handleNotionError(error, 'List databases', { limit: options.limit })
      }
    })

  database
    .command('get')
    .description('Get database schema and properties')
    .argument('<database-id>', 'Database ID')
    .action(async (databaseId: string, _options, command: Command) => {
      try {
        const format = getFormat(command)
        const notion = createNotionClient()

        // Get database
        const db = await notion.databases.retrieve({ database_id: databaseId })

        const result = {
          id: db.id,
          title: extractTitle(db),
          url: (db as any).url,
          created_time: (db as any).created_time,
          last_edited_time: (db as any).last_edited_time,
          archived: (db as any).archived,
          properties: db.properties,
        }

        output({ database: result }, format)
      } catch (error) {
        handleNotionError(error, 'Get database', { databaseId })
      }
    })

  database
    .command('query')
    .description('Query database entries')
    .argument('<database-id>', 'Database ID')
    .option('-f, --filter <json>', 'Filter as JSON string')
    .option('-s, --sorts <json>', 'Sorts as JSON string')
    .option('-l, --limit <number>', 'Maximum number of entries to return', '100')
    .action(async (databaseId: string, options, command: Command) => {
      try {
        const format = getFormat(command)
        const limit = Number.parseInt(options.limit, 10)

        const notion = createNotionClient()

        // Prepare query
        const query: any = {
          database_id: databaseId,
          page_size: Math.min(limit, 100),
        }

        // Parse filter if provided
        if (options.filter) {
          try {
            query.filter = JSON.parse(options.filter)
          } catch {
            console.error('✗ Invalid filter JSON')
            console.error('  Filter must be valid JSON')
            process.exit(1)
          }
        }

        // Parse sorts if provided
        if (options.sorts) {
          try {
            query.sorts = JSON.parse(options.sorts)
          } catch {
            console.error('✗ Invalid sorts JSON')
            console.error('  Sorts must be valid JSON')
            process.exit(1)
          }
        }

        // Query database
        const response = await notion.databases.query(query)

        const entries = response.results.map((page: any) => ({
          id: page.id,
          properties: page.properties,
          url: page.url,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time,
          archived: page.archived,
        }))

        output(
          {
            entries,
            total: entries.length,
            has_more: response.has_more,
          },
          format,
        )
      } catch (error) {
        handleNotionError(error, 'Query database', {
          databaseId,
          filter: options.filter,
          sorts: options.sorts,
        })
      }
    })

  database
    .command('create')
    .description('Create a new database')
    .requiredOption('-t, --title <title>', 'Database title')
    .requiredOption('-p, --parent <id>', 'Parent page ID')
    .option('-s, --schema <json>', 'Database schema as JSON')
    .action(async (options, command: Command) => {
      try {
        const format = getFormat(command)
        const notion = createNotionClient()

        // Prepare parent
        const parent = { type: 'page_id', page_id: options.parent }

        // Prepare title
        const title = [
          {
            type: 'text',
            text: { content: options.title },
          },
        ]

        // Default schema if not provided
        let properties: any = {
          Name: {
            title: {},
          },
        }

        // Parse custom schema if provided
        if (options.schema) {
          try {
            properties = JSON.parse(options.schema)
          } catch {
            console.error('✗ Invalid schema JSON')
            console.error('  Schema must be valid JSON')
            process.exit(1)
          }
        }

        // Create database
        const newDb = await notion.databases.create({
          parent: parent as any,
          title: title as any,
          properties,
        })

        output(
          {
            status: 'success',
            database: {
              id: newDb.id,
              title: options.title,
              url: (newDb as any).url,
            },
          },
          format,
        )
      } catch (error) {
        handleNotionError(error, 'Create database', {
          title: options.title,
          parent: options.parent,
        })
      }
    })

  database
    .command('update')
    .description('Update database properties')
    .argument('<database-id>', 'Database ID')
    .option('-t, --title <title>', 'New database title')
    .option('-s, --schema <json>', 'Updated schema as JSON')
    .option('-a, --archive', 'Archive the database')
    .option('-u, --unarchive', 'Unarchive the database')
    .action(async (databaseId: string, options, command: Command) => {
      try {
        const format = getFormat(command)
        const notion = createNotionClient()

        // Prepare update
        const update: any = {}

        if (options.title) {
          update.title = [
            {
              type: 'text',
              text: { content: options.title },
            },
          ]
        }

        if (options.schema) {
          try {
            update.properties = JSON.parse(options.schema)
          } catch {
            console.error('✗ Invalid schema JSON')
            console.error('  Schema must be valid JSON')
            process.exit(1)
          }
        }

        if (options.archive) {
          update.archived = true
        } else if (options.unarchive) {
          update.archived = false
        }

        if (Object.keys(update).length === 0) {
          console.error('✗ No updates specified')
          console.error('  Use --title, --schema, --archive, or --unarchive')
          process.exit(1)
        }

        // Update database
        const updatedDb = await notion.databases.update({
          database_id: databaseId,
          ...update,
        })

        output(
          {
            status: 'success',
            database: {
              id: updatedDb.id,
              title: extractTitle(updatedDb),
              archived: (updatedDb as any).archived,
            },
          },
          format,
        )
      } catch (error) {
        handleNotionError(error, 'Update database', {
          databaseId,
          ...options,
        })
      }
    })

  return database
}

/**
 * Extract title from database object
 */
function extractTitle(db: any): string {
  if (db.title?.[0]?.plain_text) {
    return db.title[0].plain_text
  }
  return 'Untitled'
}

/**
 * Get output format from parent command
 */
function getFormat(command: Command): OutputFormat {
  return (command.parent?.parent?.opts()?.format || 'toon') as OutputFormat
}
