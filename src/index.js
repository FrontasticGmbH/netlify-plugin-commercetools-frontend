import * as dotenv from 'dotenv'
import * as fs from 'fs'

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

  return true
}
