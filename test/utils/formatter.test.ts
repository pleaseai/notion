import { expect, test } from 'bun:test'
import { encodeJson, encodePlain, encodeToon, formatOutput } from '../../src/utils/formatter.ts'

test('encodeToon should format data in TOON format', () => {
  const data = { name: 'Test', count: 42 }
  const result = encodeToon(data)

  expect(result).toContain('name')
  expect(result).toContain('Test')
  expect(result).toContain('42')
})

test('encodeJson should format data as pretty JSON', () => {
  const data = { name: 'Test', count: 42 }
  const result = encodeJson(data)

  expect(result).toContain('"name": "Test"')
  expect(result).toContain('"count": 42')
})

test('encodePlain should format data as human-readable text', () => {
  const data = { name: 'Test', count: 42 }
  const result = encodePlain(data)

  expect(result).toContain('name: Test')
  expect(result).toContain('count: 42')
})

test('encodePlain should handle nested objects', () => {
  const data = {
    user: {
      name: 'John',
      age: 30,
    },
  }
  const result = encodePlain(data)

  expect(result).toContain('user:')
  expect(result).toContain('name: John')
  expect(result).toContain('age: 30')
})

test('encodePlain should handle arrays', () => {
  const data = { items: ['one', 'two', 'three'] }
  const result = encodePlain(data)

  expect(result).toContain('items:')
  expect(result).toContain('one')
  expect(result).toContain('two')
  expect(result).toContain('three')
})

test('formatOutput should use correct formatter based on format option', () => {
  const data = { test: 'value' }

  const toonResult = formatOutput(data, { format: 'toon' })
  expect(toonResult).toContain('test')
  expect(toonResult).toContain('value')

  const jsonResult = formatOutput(data, { format: 'json' })
  expect(jsonResult).toContain('"test": "value"')

  const plainResult = formatOutput(data, { format: 'plain' })
  expect(plainResult).toContain('test: value')
})
