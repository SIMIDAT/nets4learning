const cracoAlias = require('craco-alias')
const CracoEnvPlugin = require('craco-plugin-env')

module.exports = {
  presets  : 'es2017',
  jest     : {
    babel    : {
      addPresets: true,
      addPlugins: true,
    },
    configure: (jestConfig, { env, paths, resolve, rootDir }) => {
      jestConfig.testTimeout = 15000
      jestConfig.testMatch = ['**/__tests__/**/*.test.[jt]s?(x)']
      jestConfig.transformIgnorePatterns = ['<rootDir>/node_modules/(?!@private-repo-name)/']
      jestConfig.testEnvironment = 'jest-environment-jsdom'
      jestConfig.moduleNameMapper = {
        // 'react-i18next': '<rootDir>/__mocks__/reacti18nextMock.js'
      }
      return jestConfig
    },
  },
  plugins  : [
    {
      plugin : CracoEnvPlugin,
      options: {
        variables: {},
      },
    },
    {
      plugin : cracoAlias,
      options: {
        baseUrl: './src',
        source : 'jsconfig',
      },
    },
  ],
  devServer: (devServerConfig, { env, paths }) => {
    devServerConfig.onBeforeSetupMiddleware = undefined
    devServerConfig.onAfterSetupMiddleware = undefined
    return devServerConfig
  },
}