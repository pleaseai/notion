import type { OutputFormat } from '../utils/formatter.ts'
import { Command } from 'commander'
import { handleNotionError } from '../lib/error-handler.ts'
import { createNotionClient } from '../lib/notion-client.ts'
import { output } from '../utils/formatter.ts'

/**
 * Create page command group
 */
export function createPageCommand(): Command {
  const page = new Command('page')
  page.description('Manage Notion pages')

  page
    .command('list')
    .description('List all accessible pages')
    .option('-l, --limit <number>', 'Maximum number of pages to return', '100')
    .action(async (options, command: Command) => {
      try {
        const format = getFormat(command)
        const limit = Number.parseInt(options.limit, 10)

        const notion = createNotionClient()

        // Search for pages
        const response = await notion.search({
          filter: { property: 'object', value: 'page' },
          page_size: Math.min(limit, 100),
        })

        const pages = response.results.map((page: any) => ({
          id: page.id,
          title: extractTitle(page),
          url: page.url,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time,
          archived: page.archived,
        }))

        output({ pages, total: pages.length }, format)
      }
      catch (error) {
        handleNotionError(error, 'List pages', { limit: options.limit })
      }
    })

  page
    .command('get')
    .description('Get page details')
    .argument('<page-id>', 'Page ID')
    .option('-c, --content', 'Include page content (blocks)', false)
    .action(async (pageId: string, options, command: Command) => {
      try {
        const format = getFormat(command)
        const notion = createNotionClient()

        // Get page properties
        const pageData = await notion.pages.retrieve({ page_id: pageId })

        const result: any = {
          id: pageData.id,
          title: extractTitle(pageData),
          url: (pageData as any).url,
          created_time: (pageData as any).created_time,
          last_edited_time: (pageData as any).last_edited_time,
          archived: (pageData as any).archived,
          properties: (pageData as any).properties,
        }

        // Get page content if requested
        if (options.content) {
          const blocks = await notion.blocks.children.list({ block_id: pageId })
          result.blocks = blocks.results
        }

        output({ page: result }, format)
      }
      catch (error) {
        handleNotionError(error, 'Get page', { pageId })
      }
    })

  page
    .command('create')
    .description('Create a new page')
    .requiredOption('-t, --title <title>', 'Page title')
    .option('-p, --parent <id>', 'Parent page or database ID')
    .option('-c, --content <text>', 'Initial page content')
    .action(async (options, command: Command) => {
      try {
        const format = getFormat(command)
        const notion = createNotionClient()

        // Prepare parent
        let parent: any
        if (options.parent) {
          // Try as page first, will auto-detect database
          parent = { type: 'page_id', page_id: options.parent }
        }
        else {
          console.error('✗ Parent page or database ID is required')
          console.error('  Use --parent <id> to specify where to create the page')
          process.exit(1)
        }

        // Prepare page properties
        const properties: any = {
          title: {
            title: [
              {
                type: 'text',
                text: { content: options.title },
              },
            ],
          },
        }

        // Prepare children (content) if provided
        const children = options.content
          ? [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [
                    {
                      type: 'text',
                      text: { content: options.content },
                    },
                  ],
                },
              },
            ]
          : undefined

        // Create page
        const newPage = await notion.pages.create({
          parent,
          properties,
          children,
        } as any)

        output(
          {
            status: 'success',
            page: {
              id: newPage.id,
              title: options.title,
              url: (newPage as any).url,
            },
          },
          format,
        )
      }
      catch (error) {
        handleNotionError(error, 'Create page', {
          title: options.title,
          parent: options.parent,
        })
      }
    })

  page
    .command('update')
    .description('Update page properties')
    .argument('<page-id>', 'Page ID')
    .option('-t, --title <title>', 'New page title')
    .option('-a, --archive', 'Archive the page')
    .option('-u, --unarchive', 'Unarchive the page')
    .action(async (pageId: string, options, command: Command) => {
      try {
        const format = getFormat(command)
        const notion = createNotionClient()

        // Prepare update
        const update: any = {}

        if (options.title) {
          update.properties = {
            title: {
              title: [
                {
                  type: 'text',
                  text: { content: options.title },
                },
              ],
            },
          }
        }

        if (options.archive) {
          update.archived = true
        }
        else if (options.unarchive) {
          update.archived = false
        }

        if (Object.keys(update).length === 0) {
          console.error('✗ No updates specified')
          console.error('  Use --title, --archive, or --unarchive')
          process.exit(1)
        }

        // Update page
        const updatedPage = await notion.pages.update({
          page_id: pageId,
          ...update,
        })

        output(
          {
            status: 'success',
            page: {
              id: updatedPage.id,
              title: extractTitle(updatedPage),
              archived: (updatedPage as any).archived,
            },
          },
          format,
        )
      }
      catch (error) {
        handleNotionError(error, 'Update page', {
          pageId,
          ...options,
        })
      }
    })

  return page
}

/**
 * Extract title from page object
 */
function extractTitle(page: any): string {
  // Try to get title from properties
  if (page.properties?.title?.title?.[0]?.plain_text) {
    return page.properties.title.title[0].plain_text
  }
  if (page.properties?.Name?.title?.[0]?.plain_text) {
    return page.properties.Name.title[0].plain_text
  }

  // Try other common title properties
  for (const [_key, prop] of Object.entries(page.properties || {})) {
    if ((prop as any).type === 'title' && (prop as any).title?.[0]?.plain_text) {
      return (prop as any).title[0].plain_text
    }
  }

  return 'Untitled'
}

/**
 * Get output format from parent command
 */
function getFormat(command: Command): OutputFormat {
  return (command.parent?.parent?.opts()?.format || 'toon') as OutputFormat
}
