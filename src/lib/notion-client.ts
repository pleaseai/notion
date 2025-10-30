import { Client } from '@notionhq/client'
import { requireAuth } from './config.ts'

/**
 * Create authenticated Notion client
 * Throws error if not authenticated
 */
export function createNotionClient(): Client {
  const token = requireAuth()
  return new Client({ auth: token })
}

/**
 * Validate Notion token by making a simple API call
 * Returns true if token is valid, false otherwise
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    const client = new Client({ auth: token })
    await client.users.me({})
    return true
  }
  catch {
    return false
  }
}
