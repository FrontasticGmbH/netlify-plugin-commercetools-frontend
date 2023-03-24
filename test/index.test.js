import { describe, beforeEach, expect, it, vi } from 'vitest'
import * as buildScript from '../src/index'
import * as nodeFetch from 'node-fetch'

vi.mock('node-fetch', async () => {
  const actual = await vi.importActual('node-fetch')
  return {
    ...actual, default: vi.fn(),
  }
})
const fetch = vi.mocked(nodeFetch.default)
const mockedCheckBackend = vi.fn(buildScript.checkBackend)
const mockSleep = vi.fn(buildScript.sleep)


describe('test', () => {
  beforeEach(() => {
  })

  it('should return up if backend is up', async function() {
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
    const result = await buildScript.checkBackend(version, path)

    expect(fetch).toBeCalledWith(path, expectedInit)
    expect(fetch).toBeCalledTimes(1)
    expect(result).toBe(true)

  })

  it('wait for waitForBackend', async function() {
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
    fetch.mockImplementationOnce(async () => ({
      json: async () => responseObj,
    }))
    mockedCheckBackend.mockResolvedValue(true)
    await buildScript.waitForBackend(version, 4, path)
    expect(fetch).toBeCalledWith(path, expectedInit)
  })

  // it('wait for waitForBackend and fails', async function() {
  //   const version = '1.0.0'
  //   const path = 'http://localhost/status/extensionrunner'
  //   const expectedInit = {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Accept: 'application/json',
  //       'Commercetools-Frontend-Extension-Version': version,
  //     },
  //   }
  //   const responseObj = { up: false }
  //   fetch.mockImplementationOnce(async () => ({
  //     json: async () => responseObj,
  //   }))
  //   mockedCheckBackend.mockResolvedValue(true);
  //   mockSleep.mockImplementation(async () => {});
  //   const result = await buildScript.waitForBackend(version, 4, path)
  //
  //   console.log('mockedCheckBackend.mock.calls', result)
  //   expect(fetch).toBeCalledWith(path, expectedInit)
  // })
})
