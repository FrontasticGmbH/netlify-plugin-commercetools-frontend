import { describe, beforeEach, expect, it, vi, afterEach } from 'vitest'
import { checkBackend } from '../src/index'
import * as nodeFetch from 'node-fetch'

vi.mock('node-fetch', async () => {
  const actual = await vi.importActual('node-fetch')
  return {
    ...actual,
    default: vi.fn(),
  }
})
const fetch = vi.mocked(nodeFetch.default)
// const mockedCheckBackend = vi.fn(checkBackend)
// const mockSleep = vi.fn(sleep)

describe('test index', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return up if backend is up', async function () {
    const version = '1.0.0'
    const path = 'http://localhost/status/extensionrunner'
    const expectedInit = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Commercetools-Frontend-Extension-Version': version,
      },
    }
    const responseObj = { up: true }
    fetch.mockImplementationOnce(async () => {
      return {
        json: async () => responseObj,
      }
    })

    const { up } = await checkBackend(version, path)

    expect(fetch).toBeCalledWith(path, expectedInit)
    expect(fetch).toBeCalledTimes(1)
    expect(up).toBe(true)
  })

  it('should return up if backend is not up', async function () {
    const version = '1.0.0'
    const path = 'http://localhost/status/extensionrunner'
    const expectedInit = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Commercetools-Frontend-Extension-Version': version,
      },
    }
    const responseObj = { up: false }
    fetch.mockImplementationOnce(async () => {
      return {
        json: async () => responseObj,
      }
    })
    const { up } = await checkBackend(version, path)

    expect(fetch).toBeCalledWith(path, expectedInit)
    expect(up).toBe(false)
  })

  /*
TODO: This test needs to have dependency injected params. Sleep is causing the test to fail
it('test if backend is called with maximum tries', async function() {
  const version = '1.0.0'
  const path = 'http://localhost/status/extensionrunner'
  const maxTries = 2

  const responseObj = { up: false }
  fetch.mockImplementationOnce(async () => ({
    json: async () => responseObj,
  }))
  mockedCheckBackend.mockImplementationOnce(async () => ({
    up: false,
  }))

  mockSleep.mockImplementationOnce(async () => {
    console.log('mocked sleep')
  })
  try {
    await waitForBackend(version, maxTries, path)
  } catch (e) {
    expect(e).toBeInstanceOf(Error)
  }
})
*/
})
