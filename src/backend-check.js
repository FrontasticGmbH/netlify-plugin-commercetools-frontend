import fetch from "node-fetch";

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
