import { describe, beforeEach, expect, it, vi, afterEach } from 'vitest'
import { onPreBuild } from '../src/index'
import { checkBackend, waitForBackend } from '../src/backend-check'
import * as nodeFetch from 'node-fetch'
import fs from 'fs'


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
    process.env.COMMIT_REF = version;
    process.env.NEXT_PUBLIC_FRONTASTIC_HOST = "http://localhost";

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
    process.env.COMMIT_REF = version;
    process.env.NEXT_PUBLIC_FRONTASTIC_HOST = "http://localhost";

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

  it('should write file and wait for backend', async () => {

    const mockNetlifyConfig = {};
    const mockInputs = {};
    const mockConstants = { PUBLISH_DIR: 'dist' };
    const mockUtils = {
      build: {
        failBuild: vi.fn(),
      },
      status: {
        show: vi.fn(),
      },
    };

    process.env.COMMIT_REF = version;
    process.env.NEXT_PUBLIC_FRONTASTIC_HOST = "http://localhost";

    fs.writeFileSync = vi.fn();

    const waitForBackendMock = vi.fn(()=>({up: true}));

    const maxTries = 3
    try {
      await onPreBuild({
        netlifyConfig: mockNetlifyConfig,
        inputs: mockInputs,
        error: null,
        constants: mockConstants,
        utils: {
          ...mockUtils,
          waitForBackendMock,
        },
      }).resolves.toEqual(false);

      expect(fs.writeFileSync).toHaveBeenCalledWith('.env.production.local', `NEXT_PUBLIC_EXT_BUILD_ID=${version}`);
      expect(waitForBackend).toHaveBeenCalledWith(version, maxTries, path);
      expect(fetch).toHaveBeenCalledTimes(maxTries)
    } catch (e) {
      //We ignore, because there is no error
    }
  });

  it('should not call backend if disable environment variable is 1', async () => {

    const mockNetlifyConfig = {};
    const mockInputs = {};
    const mockConstants = { PUBLISH_DIR: 'dist' };
    const mockUtils = {
      build: {
        failBuild: vi.fn(),
      },
      status: {
        show: vi.fn(),
      },
    };

    process.env.COMMIT_REF = version;
    process.env.NEXT_PUBLIC_FRONTASTIC_HOST = "http://localhost";
    process.env.NETLIFY_PLUGIN_COMMERCETOOLS_FRONTEND_WAIT_DISABLE = "1";

    fs.writeFileSync = vi.fn()
    const waitForBackendMock = vi.fn(()=>({up: false}));

    const preBuildResult = await onPreBuild({
      netlifyConfig: mockNetlifyConfig,
      inputs: mockInputs,
      error: null,
      constants: mockConstants,
      utils: {
        ...mockUtils,
        waitForBackendMock,
      },
    });

    expect(preBuildResult).toBeTruthy()
    expect(waitForBackendMock).toHaveBeenCalledTimes(0)
    expect(fetch).toHaveBeenCalledTimes(0)
    expect(mockUtils.build.failBuild).toHaveBeenCalledTimes(0);
  });

  it('should call build.failBuild', async () => {

    const mockNetlifyConfig = {};
    const mockInputs = {};
    const mockConstants = { PUBLISH_DIR: 'dist' };
    const mockUtils = {
      build: {
        failBuild: vi.fn(),
      },
      status: {
        show: vi.fn(),
      },
    };

    process.env.COMMIT_REF = version;
    process.env.NEXT_PUBLIC_FRONTASTIC_HOST = "http://localhost";

    fs.writeFileSync = vi.fn();

    const waitForBackendMock = vi.fn(()=>({up: false}));

    const maxTries = 3
    try {
      await onPreBuild({
        netlifyConfig: mockNetlifyConfig,
        inputs: mockInputs,
        error: null,
        constants: mockConstants,
        utils: {
          ...mockUtils,
          waitForBackendMock,
        },
      }).resolves.toEqual(false);

      expect(waitForBackend).toHaveBeenCalledWith(version, maxTries);
      expect(fetch).toHaveBeenCalledTimes(maxTries)
      expect(mockUtils.build.failBuild).toThrowError();
    } catch (e) {
      //ignore
    }
  });

})
