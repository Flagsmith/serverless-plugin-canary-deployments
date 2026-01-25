/* eslint-disable no-template-curly-in-string */

const { expect } = require('chai')
const CloudWatch = require('./CloudWatch')

describe('CloudWatch', () => {
  describe('.resolveAlarmConfig', () => {
    it('resolves errors preset correctly', () => {
      // Given
      const config = { type: 'errors' }

      // When
      const resolved = CloudWatch.resolveAlarmConfig(config)

      // Then
      expect(resolved).to.deep.equal({
        metric: 'Errors',
        namespace: 'AWS/Lambda',
        statistic: 'Sum',
        period: 60,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        threshold: 1000,
        comparisonOperator: 'GreaterThanThreshold',
        treatMissingData: 'notBreaching'
      })
    })

    it('merges preset with user overrides', () => {
      // Given
      const config = { type: 'errors', threshold: 5 }

      // When
      const resolved = CloudWatch.resolveAlarmConfig(config)

      // Then
      expect(resolved.threshold).to.equal(5)
      expect(resolved.metric).to.equal('Errors')
    })

    it('uses defaults for custom config without preset', () => {
      // Given
      const config = { metric: 'Duration', threshold: 5000 }

      // When
      const resolved = CloudWatch.resolveAlarmConfig(config)

      // Then
      expect(resolved.metric).to.equal('Duration')
      expect(resolved.threshold).to.equal(5000)
      expect(resolved.statistic).to.equal('Sum')
      expect(resolved.period).to.equal(60)
    })
  })

  describe('.buildCanaryAlarm', () => {
    const baseParams = {
      alarmName: 'myfunction-canary-errors',
      functionName: 'MyFunctionLambdaFunction',
      functionRef: 'MyFunctionLambdaFunction',
      versionName: 'MyFunctionLambdaVersionABC123',
      aliasName: 'Live',
      alarmConfig: { type: 'errors' },
      serviceName: 'my-service',
      stage: 'prod'
    }

    it('generates correct alarm structure with ExecutedVersion dimension', () => {
      // Given
      const params = baseParams

      // When
      const alarm = CloudWatch.buildCanaryAlarm(params)

      // Then
      expect(alarm.Type).to.equal('AWS::CloudWatch::Alarm')
      expect(alarm.Properties.AlarmName).to.deep.equal({
        'Fn::Sub': 'my-service-prod-myfunction-canary-errors-v${MyFunctionLambdaVersionABC123.Version}'
      })
      expect(alarm.Properties.MetricName).to.equal('Errors')
      expect(alarm.Properties.Namespace).to.equal('AWS/Lambda')
    })

    it('includes FunctionName, Resource, and ExecutedVersion dimensions', () => {
      // Given
      const params = baseParams

      // When
      const alarm = CloudWatch.buildCanaryAlarm(params)

      // Then
      const dimensions = alarm.Properties.Dimensions
      expect(dimensions).to.have.length(3)

      const functionDim = dimensions.find(d => d.Name === 'FunctionName')
      expect(functionDim.Value).to.deep.equal({ Ref: 'MyFunctionLambdaFunction' })

      const resourceDim = dimensions.find(d => d.Name === 'Resource')
      expect(resourceDim.Value).to.deep.equal({
        'Fn::Join': [':', [{ Ref: 'MyFunctionLambdaFunction' }, 'Live']]
      })

      const versionDim = dimensions.find(d => d.Name === 'ExecutedVersion')
      expect(versionDim.Value).to.deep.equal({
        'Fn::GetAtt': ['MyFunctionLambdaVersionABC123', 'Version']
      })
    })

    it('applies errors preset defaults', () => {
      // Given
      const params = baseParams

      // When
      const alarm = CloudWatch.buildCanaryAlarm(params)

      // Then
      expect(alarm.Properties.Statistic).to.equal('Sum')
      expect(alarm.Properties.Period).to.equal(60)
      expect(alarm.Properties.EvaluationPeriods).to.equal(1)
      expect(alarm.Properties.DatapointsToAlarm).to.equal(1)
      expect(alarm.Properties.Threshold).to.equal(1000)
      expect(alarm.Properties.ComparisonOperator).to.equal('GreaterThanThreshold')
      expect(alarm.Properties.TreatMissingData).to.equal('notBreaching')
    })

    it('allows overriding preset values', () => {
      // Given
      const params = {
        ...baseParams,
        alarmConfig: { type: 'errors', threshold: 5 }
      }

      // When
      const alarm = CloudWatch.buildCanaryAlarm(params)

      // Then
      expect(alarm.Properties.Threshold).to.equal(5)
      expect(alarm.Properties.MetricName).to.equal('Errors')
    })

    it('supports custom metric configuration', () => {
      // Given
      const params = {
        ...baseParams,
        alarmConfig: {
          metric: 'Duration',
          threshold: 5000,
          statistic: 'Average',
          comparisonOperator: 'GreaterThanThreshold'
        }
      }

      // When
      const alarm = CloudWatch.buildCanaryAlarm(params)

      // Then
      expect(alarm.Properties.MetricName).to.equal('Duration')
      expect(alarm.Properties.Threshold).to.equal(5000)
      expect(alarm.Properties.Statistic).to.equal('Average')
    })

    it('throws error if metric is missing for custom config', () => {
      // Given
      const params = {
        ...baseParams,
        alarmConfig: { threshold: 100 }
      }

      // When/Then
      expect(() => CloudWatch.buildCanaryAlarm(params)).to.throw('requires a metric')
    })

    it('throws error if threshold is missing for custom config', () => {
      // Given
      const params = {
        ...baseParams,
        alarmConfig: { metric: 'Errors' }
      }

      // When/Then
      expect(() => CloudWatch.buildCanaryAlarm(params)).to.throw('requires a threshold')
    })
  })

  describe('.buildCompositeAlarm', () => {
    it('generates correct OR rule for multiple alarms', () => {
      // Given
      const params = {
        alarmName: 'canary-composite',
        alarmLogicalIds: ['HelloCanaryErrorsAlarm', 'WorldCanaryErrorsAlarm'],
        serviceName: 'my-service',
        stage: 'prod'
      }

      // When
      const alarm = CloudWatch.buildCompositeAlarm(params)

      // Then
      expect(alarm.Type).to.equal('AWS::CloudWatch::CompositeAlarm')
      expect(alarm.Properties.AlarmName).to.deep.equal({
        'Fn::Sub': 'my-service-prod-canary-composite'
      })
      expect(alarm.Properties.AlarmRule).to.deep.equal({
        'Fn::Sub': 'ALARM(${HelloCanaryErrorsAlarm}) OR ALARM(${WorldCanaryErrorsAlarm})'
      })
    })

    it('handles single alarm case', () => {
      // Given
      const params = {
        alarmName: 'canary-composite',
        alarmLogicalIds: ['HelloCanaryErrorsAlarm'],
        serviceName: 'my-service',
        stage: 'prod'
      }

      // When
      const alarm = CloudWatch.buildCompositeAlarm(params)

      // Then
      expect(alarm.Properties.AlarmRule).to.deep.equal({
        'Fn::Sub': 'ALARM(${HelloCanaryErrorsAlarm})'
      })
    })

    it('throws error if no alarm IDs provided', () => {
      // Given
      const params = {
        alarmName: 'canary-composite',
        alarmLogicalIds: [],
        serviceName: 'my-service',
        stage: 'prod'
      }

      // When/Then
      expect(() => CloudWatch.buildCompositeAlarm(params)).to.throw('at least one alarm')
    })
  })
})
