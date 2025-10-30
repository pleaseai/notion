import { encode } from '@byjohann/toon'

/**
 * Supported output formats
 */
export type OutputFormat = 'toon' | 'json' | 'plain'

/**
 * Formatter options
 */
export interface FormatterOptions {
  format: OutputFormat
  colors?: boolean
}

/**
 * Encode data to TOON format with tab delimiters
 *
 * Tab delimiter provides 58.9% token reduction vs JSON
 * compared to 49.1% with comma delimiter
 */
export function encodeToon(data: unknown): string {
  return encode(data, {
    delimiter: '\t',
    indent: 2,
  })
}

/**
 * Format data to JSON with pretty printing
 */
export function encodeJson(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Format data to plain text (human-readable)
 * Recursively formats objects and arrays
 */
export function encodePlain(data: unknown, indent = 0): string {
  const spaces = '  '.repeat(indent)

  if (data === null || data === undefined) {
    return `${spaces}null`
  }

  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return `${spaces}${data}`
  }

  if (Array.isArray(data)) {
    if (data.length === 0)
      return `${spaces}[]`
    return data.map(item => encodePlain(item, indent)).join('\n')
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data)
    if (entries.length === 0)
      return `${spaces}{}`

    return entries
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return `${spaces}${key}:\n${encodePlain(value, indent + 1)}`
        }
        return `${spaces}${key}: ${encodePlain(value, 0).trim()}`
      })
      .join('\n')
  }

  return `${spaces}${String(data)}`
}

/**
 * Format output based on specified format
 */
export function formatOutput(data: unknown, options: FormatterOptions): string {
  const { format } = options

  switch (format) {
    case 'toon':
      return encodeToon(data)
    case 'json':
      return encodeJson(data)
    case 'plain':
      return encodePlain(data)
  }
}

/**
 * Output formatted data to console
 */
export function output(data: unknown, format: OutputFormat): void {
  console.log(formatOutput(data, { format }))
}
