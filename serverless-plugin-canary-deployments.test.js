/* eslint-disable no-template-curly-in-string */

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

  describe('buildCanaryAlarmResources', () => {
    const createMockServerless = (service) => ({
      service: {
        service: service.service,
        getAllFunctions: () => Object.keys(service.functions),
        getFunction: (name) => service.functions[name],
        provider: {
          compiledCloudFormationTemplate: {
            Resources: {
              HelloLambdaFunction: { Type: 'AWS::Lambda::Function' },
              HelloLambdaVersionABC123: {
                Type: 'AWS::Lambda::Version',
                Properties: { FunctionName: { Ref: 'HelloLambdaFunction' } }
              },
              WorldLambdaFunction: { Type: 'AWS::Lambda::Function' },
              WorldLambdaVersionDEF456: {
                Type: 'AWS::Lambda::Version',
                Properties: { FunctionName: { Ref: 'WorldLambdaFunction' } }
              }
            }
          }
        },
        custom: {}
      },
      getProvider: () => ({
        naming: {
          getStackName: () => 'canary-deployments-test-dev',
          normalizeNameToAlphaNumericOnly: (str) => str.replace(/[^a-zA-Z0-9]/g, ''),
          getLambdaLogicalId: (name) => `${name.charAt(0).toUpperCase()}${name.slice(1)}LambdaFunction`,
          getRoleLogicalId: () => 'IamRoleLambdaExecution'
        },
        getStage: () => 'dev'
      }),
      configSchemaHandler: null
    })

    it('returns correct logical IDs for canary alarms', () => {
      // Given
      const service = {
        service: 'my-service',
        functions: {
          hello: {
            handler: 'handler.hello',
            deploymentSettings: {
              type: 'Linear10PercentEvery1Minute',
              alias: 'Live',
              canaryAlarms: [{ type: 'errors' }]
            }
          }
        }
      }
      const serverless = createMockServerless(service)
      const plugin = new ServerlessCanaryDeployments(serverless, { stage: 'dev' })

      // When
      const resources = plugin.buildCanaryAlarmResources()

      // Then
      const logicalIds = resources.map(r => Object.keys(r)[0])
      expect(logicalIds).to.include('HelloLambdaFunctionCanaryerrorsAlarm')
      expect(logicalIds).to.include('CanaryDeploymentCompositeAlarm')
    })

    it('uses predictable naming for composite alarm (${service}-${stage}-canary-composite)', () => {
      // Given
      const service = {
        service: 'my-service',
        functions: {
          hello: {
            handler: 'handler.hello',
            deploymentSettings: {
              type: 'Linear10PercentEvery1Minute',
              alias: 'Live',
              canaryAlarms: [{ type: 'errors' }]
            }
          }
        }
      }
      const serverless = createMockServerless(service)
      const plugin = new ServerlessCanaryDeployments(serverless, { stage: 'dev' })

      // When
      const resources = plugin.buildCanaryAlarmResources()

      // Then
      const compositeResource = resources.find(r => Object.keys(r)[0] === 'CanaryDeploymentCompositeAlarm')
      const composite = compositeResource.CanaryDeploymentCompositeAlarm
      expect(composite.Properties.AlarmName).to.deep.equal({
        'Fn::Sub': 'my-service-dev-canary-composite'
      })
    })

    it('does not include functions without canaryAlarms in composite', () => {
      // Given
      const service = {
        service: 'my-service',
        functions: {
          hello: {
            handler: 'handler.hello',
            deploymentSettings: {
              type: 'Linear10PercentEvery1Minute',
              alias: 'Live',
              canaryAlarms: [{ type: 'errors' }]
            }
          },
          world: {
            handler: 'handler.world',
            deploymentSettings: {
              type: 'Linear10PercentEvery1Minute',
              alias: 'Live'
              // No canaryAlarms
            }
          }
        }
      }
      const serverless = createMockServerless(service)
      const plugin = new ServerlessCanaryDeployments(serverless, { stage: 'dev' })

      // When
      const resources = plugin.buildCanaryAlarmResources()

      // Then
      expect(resources).to.have.length(2) // hello's alarm + composite
      const logicalIds = resources.map(r => Object.keys(r)[0])
      expect(logicalIds).to.include('HelloLambdaFunctionCanaryerrorsAlarm')
      expect(logicalIds).to.not.include('WorldLambdaFunctionCanaryerrorsAlarm')

      const compositeResource = resources.find(r => Object.keys(r)[0] === 'CanaryDeploymentCompositeAlarm')
      const alarmRule = compositeResource.CanaryDeploymentCompositeAlarm.Properties.AlarmRule['Fn::Sub']
      expect(alarmRule).to.include('HelloLambdaFunctionCanaryerrorsAlarm')
      expect(alarmRule).to.not.include('World')
    })
  })
})
