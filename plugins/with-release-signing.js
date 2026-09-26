// Expo config plugin: signs release builds with DangerBear's own key
// instead of the shared debug key, and survives `expo prebuild --clean`.
//
// The key and its passwords are never in the repo. They're read from Gradle
// properties, kept in ~/.gradle/gradle.properties on the build machine:
//   DANGERBEAR_UPLOAD_STORE_FILE, DANGERBEAR_UPLOAD_KEY_ALIAS,
//   DANGERBEAR_UPLOAD_STORE_PASSWORD, DANGERBEAR_UPLOAD_KEY_PASSWORD
// If they're missing, release builds fall back to the debug key (as the
// Expo template does), so the project still builds on other machines.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// dangerbear-release-signing';

const RELEASE_SIGNING_CONFIG = `
        ${MARKER}
        release {
            if (project.hasProperty('DANGERBEAR_UPLOAD_STORE_FILE')) {
                storeFile file(DANGERBEAR_UPLOAD_STORE_FILE)
                storePassword DANGERBEAR_UPLOAD_STORE_PASSWORD
                keyAlias DANGERBEAR_UPLOAD_KEY_ALIAS
                keyPassword DANGERBEAR_UPLOAD_KEY_PASSWORD
            }
        }`;

function addReleaseSigning(gradle) {
  if (gradle.includes(MARKER)) {
    return gradle;
  }

  // Add a release signing config after the template's debug one.
  const withConfig = gradle.replace(
    /(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/,
    `$1${RELEASE_SIGNING_CONFIG}`
  );
  if (withConfig === gradle) {
    throw new Error('with-release-signing: could not find signingConfigs.debug in app/build.gradle');
  }

  // Point the release build type at it when the key is configured.
  const withBuildType = withConfig.replace(
    /(release\s*\{[^{}]*?)signingConfig signingConfigs\.debug/,
    `$1signingConfig project.hasProperty('DANGERBEAR_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`
  );
  if (withBuildType === withConfig) {
    throw new Error('with-release-signing: could not find the release build type signing line');
  }
  return withBuildType;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      throw new Error('with-release-signing: expected a Groovy app/build.gradle');
    }
    modConfig.modResults.contents = addReleaseSigning(modConfig.modResults.contents);
    return modConfig;
  });
};
