const fs = require('fs')
const path = require('path')
const chai = require('chai')
const _ = require('lodash/fp')
const ServerlessCanaryDeployments = require('./serverless-plugin-canary-deployments')
const Serverless = require('serverless')

const { expect } = chai
const fixturesPath = path.resolve(__dirname, 'fixtures')

describe('ServerlessCanaryDeployments', () => {
  const stage = 'dev'
  const options = { stage }

  describe('addCanaryDeploymentResources', () => {
    const testCaseFiles = fs.readdirSync(fixturesPath)
    const getTestCaseName = _.pipe(_.split('.'), _.head)
    const testCaseFileType = _.pipe(_.split('.'), _.get('[1]'))
    const testCaseContentsFromFiles = _.reduce((acc, fileName) => {
      const contents = JSON.parse(fs.readFileSync(path.resolve(fixturesPath, fileName)))
      return _.set(testCaseFileType(fileName), contents, acc)
    }, {})
    const testCaseFilesByName = _.groupBy(getTestCaseName, testCaseFiles)
    this.testCases = _.map(
      (caseName) => {
        const testCaseContents = testCaseContentsFromFiles(testCaseFilesByName[caseName])
        return Object.assign(testCaseContents, { caseName })
      },
      Object.keys(testCaseFilesByName)
    )

    this.testCases.forEach(({ caseName, input, output, service }) => {
      it(`generates the correct CloudFormation templates: test case ${caseName}`, async () => {
        const serverless = new Serverless({
          configuration: {
            service: 'canary-deployments-test',
            provider: { name: 'aws' },
            configValidationMode: 'off',
            plugins: []
          },
          commands: [],
          options
        })

        // Initialize serverless (this automatically sets up the AWS provider)
        await serverless.init()

        Object.assign(serverless.service, service)
        serverless.service.provider.compiledCloudFormationTemplate = input

        const plugin = new ServerlessCanaryDeployments(serverless, options)
        plugin.addCanaryDeploymentResources()
        expect(serverless.service.provider.compiledCloudFormationTemplate).to.deep.equal(output)
      })
    })
  })
})
