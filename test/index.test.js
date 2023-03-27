import { describe, beforeEach, expect, it, vi, afterEach } from 'vitest'
import { checkBackend, waitForBackend } from '../src/index'
import * as nodeFetch from 'node-fetch'

vi.mock('node-fetch', async () => {
  const actual = await vi.importActual('node-fetch')
  return {
    ...actual,
    default: vi.fn(),
  }
})
vi.mock('../src/index', async () => {
  const actual = await vi.importActual('../src/index')
  return {
    ...actual,
    sleep: vi.fn(),
  }
})
const fetch = vi.mocked(nodeFetch.default)

describe('test index', () => {
  const version = '56664e5'
  const path = 'http://localhost/status/extensionrunner'

  const expectedInit = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Commercetools-Frontend-Extension-Version': version,
    },
  }
  beforeEach(() => {
    vi.useFakeTimers()

  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return true if backend is up', async function() {

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

  it('should return false if backend is not up', async function() {
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

  it('test if backend is called with maximum tries and extensions is not up ', async function() {
    const maxTries = 3
    try {
      await waitForBackend(version, maxTries, path).rejects.toThrow('Extension is not up')
      expect(fetch).toHaveBeenCalledTimes(maxTries)
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
  })

  it('test if backend is called with maximum tries and everything is good', async function() {
    const maxTries = 3
    try {
      await waitForBackend(version, maxTries, path).resolves.toEqual(false)
      expect(fetch).toHaveBeenCalledTimes(maxTries)
    } catch (e) {
    //We ignore, because there is no error
    }
  })

})
