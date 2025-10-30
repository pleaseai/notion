/**
 * Handle Notion API errors with helpful messages
 */
export function handleNotionError(
  error: any,
  operation: string,
  context: Record<string, any> = {},
): never {
  // Notion API errors
  if (error.code) {
    handleNotionApiError(error.code, error.message, operation, context)
  }

  // HTTP errors
  if (error.status) {
    handleHttpError(error.status, operation, context)
  }

  // Network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    console.error('✗ Network error')
    console.error('  Could not connect to Notion API. Check your internet connection.')
    logContext(context)
    process.exit(1)
  }

  // Generic error
  console.error(`✗ ${operation} failed: ${error.message || String(error)}`)
  logContext(context)

  if (process.env.DEBUG) {
    console.error('\n  Full error details:')
    console.error(error)
  }

  process.exit(1)
}

/**
 * Handle Notion-specific API error codes
 */
function handleNotionApiError(
  code: string,
  message: string,
  operation: string,
  context: Record<string, any>,
): never {
  console.error(`✗ ${operation} failed`)

  // Handle common Notion API error codes
  switch (code) {
    case 'unauthorized':
      console.error('  Authentication failed. Your token may be invalid or expired.')
      console.error('  Run "notion auth login" to re-authenticate.')
      break
    case 'restricted_resource':
      console.error('  Access denied. You may not have permission for this resource.')
      break
    case 'object_not_found':
      console.error('  Resource not found. Check the ID and try again.')
      break
    case 'rate_limited':
      console.error('  Rate limit exceeded. Please wait a moment and try again.')
      break
    case 'invalid_json':
    case 'invalid_request':
      console.error(`  Invalid request: ${message}`)
      break
    case 'validation_error':
      console.error(`  Validation error: ${message}`)
      break
    case 'conflict_error':
      console.error('  Conflict error. The resource may have been modified.')
      break
    case 'service_unavailable':
      console.error('  Notion service is temporarily unavailable. Try again later.')
      break
    default:
      console.error(`  Error: ${message}`)
  }

  logContext(context)
  process.exit(1)
}

/**
 * Handle HTTP status code errors
 */
function handleHttpError(
  status: number,
  operation: string,
  context: Record<string, any>,
): never {
  console.error(`✗ ${operation} failed`)

  switch (status) {
    case 400:
      console.error('  Bad request. Check your input and try again.')
      break
    case 401:
      console.error('  Authentication failed.')
      console.error('  Run "notion auth login" to re-authenticate.')
      break
    case 403:
      console.error('  Permission denied.')
      break
    case 404:
      console.error('  Resource not found.')
      break
    case 429:
      console.error('  Rate limit exceeded. Please wait and try again.')
      break
    case 500:
    case 502:
    case 503:
      console.error('  Notion server error. Please try again later.')
      break
    default:
      console.error(`  HTTP ${status} error.`)
  }

  logContext(context)
  process.exit(1)
}

/**
 * Log context information for debugging
 */
function logContext(context: Record<string, any>): void {
  const entries = Object.entries(context)
  if (entries.length === 0)
    return

  console.error('\n  Context:')
  for (const [key, value] of entries) {
    // Don't log sensitive information
    if (key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
      console.error(`    ${key}: [REDACTED]`)
    }
    else {
      console.error(`    ${key}: ${value}`)
    }
  }
}
