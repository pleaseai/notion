import { test, expect, beforeEach, afterEach } from 'bun:test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { homedir } from 'node:os'
import { loadConfig, saveConfig, deleteConfig, requireAuth } from '../../src/lib/config.ts'

const CONFIG_DIR = path.join(homedir(), '.notion-cli')
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json')

// Save existing config if any
let existingConfig: string | null = null

beforeEach(() => {
  // Backup existing config
  if (fs.existsSync(CONFIG_PATH)) {
    existingConfig = fs.readFileSync(CONFIG_PATH, 'utf-8')
    fs.unlinkSync(CONFIG_PATH)
  }
})

afterEach(() => {
  // Clean up test config
  if (fs.existsSync(CONFIG_PATH)) {
    fs.unlinkSync(CONFIG_PATH)
  }

  // Restore original config if it existed
  if (existingConfig) {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true })
    }
    fs.writeFileSync(CONFIG_PATH, existingConfig)
    existingConfig = null
  }
})

test('loadConfig should return null when config does not exist', () => {
  const config = loadConfig()
  expect(config).toBeNull()
})

test('saveConfig should create directory and save config', () => {
  const testConfig = { notionToken: 'test_token' }
  saveConfig(testConfig)

  expect(fs.existsSync(CONFIG_DIR)).toBe(true)
  expect(fs.existsSync(CONFIG_PATH)).toBe(true)
})

test('loadConfig should read saved config', () => {
  const testConfig = { notionToken: 'test_token', defaultWorkspace: 'workspace123' }
  saveConfig(testConfig)

  const loaded = loadConfig()
  expect(loaded).toEqual(testConfig)
})

test('deleteConfig should remove config file', () => {
  const testConfig = { notionToken: 'test_token' }
  saveConfig(testConfig)

  deleteConfig()
  expect(fs.existsSync(CONFIG_PATH)).toBe(false)
})

test('deleteConfig should not throw when config does not exist', () => {
  expect(() => deleteConfig()).not.toThrow()
})

test('requireAuth should throw when not authenticated', () => {
  expect(() => requireAuth()).toThrow('Not authenticated')
})

test('requireAuth should return token when authenticated', () => {
  const testConfig = { notionToken: 'test_token' }
  saveConfig(testConfig)

  const token = requireAuth()
  expect(token).toBe('test_token')
})
