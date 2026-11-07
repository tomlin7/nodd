import type { AssertionResult, AssertionType, HttpResponse, RequestAssertion } from './types'
import { createId } from './url'

export function createAssertion(type: AssertionType, expected: string): RequestAssertion {
  return {
    id: createId('assert'),
    type,
    expected,
    enabled: true,
  }
}

export function formatAssertionLabel(type: AssertionType): string {
  switch (type) {
    case 'status_code':
      return 'Status code equals'
    case 'response_time':
      return 'Response time (ms) <='
    case 'body_contains':
      return 'Body contains string'
    case 'json_path_exists':
      return 'JSON body has key'
  }
}

export function runAssertions(
  assertions?: RequestAssertion[],
  response?: HttpResponse | null
): AssertionResult[] {
  if (!assertions || assertions.length === 0 || !response) {
    return []
  }

  const results: AssertionResult[] = []

  for (const assertion of assertions) {
    if (!assertion.enabled) continue

    const expected = assertion.expected.trim()

    switch (assertion.type) {
      case 'status_code': {
        const expectedCode = parseInt(expected, 10)
        const passed = !isNaN(expectedCode) && response.status === expectedCode
        results.push({
          assertion,
          passed,
          message: passed
            ? `Status code is ${response.status}`
            : `Expected status code ${expected}, received ${response.status}`,
          actual: `${response.status}`,
        })
        break
      }

      case 'response_time': {
        const expectedMs = parseInt(expected, 10)
        const passed = !isNaN(expectedMs) && response.timeMs <= expectedMs
        results.push({
          assertion,
          passed,
          message: passed
            ? `Response completed in ${response.timeMs}ms (<= ${expectedMs}ms)`
            : `Response took ${response.timeMs}ms, exceeded ${expectedMs}ms threshold`,
          actual: `${response.timeMs}ms`,
        })
        break
      }

      case 'body_contains': {
        const passed = response.body.includes(expected)
        results.push({
          assertion,
          passed,
          message: passed
            ? `Response body contains "${expected}"`
            : `Response body did not contain substring "${expected}"`,
          actual: response.body.slice(0, 100),
        })
        break
      }

      case 'json_path_exists': {
        let passed = false
        let actualVal = 'N/A'
        try {
          const parsed = JSON.parse(response.body)
          if (parsed && typeof parsed === 'object') {
            const hasKey = Object.prototype.hasOwnProperty.call(parsed, expected)
            passed = hasKey
            actualVal = hasKey ? JSON.stringify(parsed[expected]) : 'undefined'
          }
        } catch {
          passed = false
          actualVal = 'Invalid JSON response'
        }

        results.push({
          assertion,
          passed,
          message: passed
            ? `JSON response contains property "${expected}"`
            : `Property "${expected}" was not found in response JSON`,
          actual: actualVal,
        })
        break
      }
    }
  }

  return results
}
