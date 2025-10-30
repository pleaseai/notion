import * as fs from 'node:fs'
import * as path from 'node:path'
import { homedir } from 'node:os'

/**
 * Configuration structure for Notion CLI
 */
export interface Config {
  notionToken?: string
  defaultWorkspace?: string
}

const CONFIG_DIR = path.join(homedir(), '.notion-cli')
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json')

/**
 * Load configuration from ~/.notion-cli/config.json
 * Returns null if config doesn't exist
 */
export function loadConfig(): Config | null {
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8')
    return JSON.parse(content) as Config
  } catch {
    return null
  }
}

/**
 * Save configuration to ~/.notion-cli/config.json
 * Creates directory if it doesn't exist
 */
export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

/**
 * Delete configuration file
 */
export function deleteConfig(): void {
  if (fs.existsSync(CONFIG_PATH)) {
    fs.unlinkSync(CONFIG_PATH)
  }
}

/**
 * Get Notion token from config
 * Throws error if not authenticated
 */
export function requireAuth(): string {
  const config = loadConfig()
  if (!config?.notionToken) {
    throw new Error('Not authenticated. Run "notion auth login" first.')
  }
  return config.notionToken
}
