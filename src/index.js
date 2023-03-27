import * as dotenv from 'dotenv'
import * as fs from 'fs'
import fetch from 'node-fetch'

dotenv.config()

/* eslint-disable no-unused-vars */
export const onPreBuild = async function ({
  netlifyConfig,
  inputs,
  error,

  // Build constants
  constants: { PUBLISH_DIR },

  // Core utilities
  utils: {
    // Utility to report errors.
    // See https://github.com/netlify/build#error-reporting
    build, // Utility to display information in the deploy summary.
    // See https://github.com/netlify/build#logging
    status,
  },
}) {
  try {
    // Commands are printed in Netlify logs
    const shortCommitHash = process.env.COMMIT_REF.substring(0, 7)
    fs.writeFileSync(
      '.env.production.local',
      `NEXT_PUBLIC_EXT_BUILD_ID=${shortCommitHash}`,
    )
    const path =
      process.env.NEXT_PUBLIC_FRONTASTIC_HOST + '/status/extensionrunner'
    await waitForBackend(shortCommitHash, 35, path)
  } catch (error) {
    // Report a user error
    build.failBuild('Error message', { error })
  }

  // Console logs are shown in Netlify logs
  console.log('Netlify configuration', netlifyConfig)
  console.log('Plugin configuration', inputs)
  console.log('Build directory', PUBLISH_DIR)

  // Display success information
  status.show({ summary: 'Success!' })
}

/*
 * Checks if the backend is ready
 * Does an HTTP request to the appropriate extension runner
 */
export const checkBackend = async (version, path) => {
  console.log('Calling ' + path, 'Version ' + version)
  const actualInit = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Commercetools-Frontend-Extension-Version': version,
    },
  }

  try {
    const response = await fetch(path, actualInit)

    if (response) {
      return await response.json()
    }
  } catch (e) {
    console.log(`Error while calling extension runner ${path}:`, e)
  }
  return { up: false }
}

/**
 * Waits for the backend extension to be ready.
 * Will attempt the number of tries passed on the maxTries parameter.
 * If the extension is not up after the maxTries an error is thrown.
 *
 * @param shortCommitHash the extension version
 * @param maxTries the max number of attempts
 * @param path the path to be tested
 * @returns {Promise<void>}
 */
export const waitForBackend = async (shortCommitHash, maxTries, path) => {
  for (let i = 0; i < maxTries; i++) {
    const attempt = i + 1
    console.log('Checking if extension is up, attempt: ', attempt)
    const { up } = await checkBackend(shortCommitHash, path)
    if (!up) {
      console.error(
        'Extension is not available, waiting for',
        attempt,
        'seconds',
      )
      await sleep(i * 1000)
    } else {
      console.log('Extension is up!')
      return
    }
  }
  throw new Error('Extension is not up')
}

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
