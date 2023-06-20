import * as dotenv from 'dotenv'
import { waitForBackend } from './backend-check.js'

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
    const buildId = netlifyConfig.build.environment.NEXT_PUBLIC_EXT_BUILD_ID

    if (!netlifyConfig.build.environment.NEXT_PUBLIC_EXT_BUILD_ID) {
      console.info(
        `NEXT_PUBLIC_EXT_BUILD_ID is not set or has falsy value. Setting it to short commit hash: "${shortCommitHash}"`,
      )
      netlifyConfig.build.environment.NEXT_PUBLIC_EXT_BUILD_ID = shortCommitHash
    } else {
      console.info(
        `NEXT_PUBLIC_EXT_BUILD_ID is already set to "${buildId}". Using that instead of current short commit hash "${shortCommitHash}"`,
      )
    }

    if (
      process.env.NETLIFY_PLUGIN_COMMERCETOOLS_FRONTEND_WAIT_DISABLE !== '1'
    ) {
      await waitForBackend(
        netlifyConfig.build.environment.NEXT_PUBLIC_EXT_BUILD_ID,
        40,
      )
    } else {
      console.warn(
        'NETLIFY_PLUGIN_COMMERCETOOLS_FRONTEND_WAIT_DISABLE is set to 1. \n' +
          `Skipping checking if the extension for the current build (${netlifyConfig.build.environment.NEXT_PUBLIC_EXT_BUILD_ID}) is up. \n` +
          'This setting can cause sites to be deployed without a corresponding backend extension.',
      )
    }
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

  return true
}
