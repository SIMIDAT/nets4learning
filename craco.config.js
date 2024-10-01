const cracoAlias = require('craco-alias')
const CracoEnvPlugin = require('craco-plugin-env')

module.exports = {
  presets: 'es2017',
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.module.rules.push({
        test: /face-api\.esm-nobundle\.js/, 
        type: 'javascript/esm'
      })
      webpackConfig.module.rules.push({
        test: /face-api\.esm\.js/, 
        type: 'javascript/esm'
      })
      return webpackConfig
    },
  },
  jest: {
    babel: {
      addPresets: true,
      addPlugins: true,
    },
    configure: (jestConfig, jestEnv) => {
      // params:
      // --watchAll=false Desactiva el modo interactivo
      // --maxWorkers=1 Modo paralelo
      // --silent Desactiva los warnings internos
      // eslint-disable-next-line no-unused-vars
      const { env, paths, resolve, rootDir } = jestEnv
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
  plugins: [
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
  devServer: (devServerConfig, devServerEnv ) => {
    // eslint-disable-next-line no-unused-vars
    const { env, paths } = devServerEnv
    devServerConfig.onBeforeSetupMiddleware = undefined
    devServerConfig.onAfterSetupMiddleware = undefined
    return devServerConfig
  },
}