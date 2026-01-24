const _ = require('lodash/fp')

const PRESETS = {
  errors: {
    metric: 'Errors',
    namespace: 'AWS/Lambda',
    statistic: 'Sum',
    period: 300,
    evaluationPeriods: 2,
    datapointsToAlarm: 1,
    threshold: 1000,
    comparisonOperator: 'GreaterThanThreshold',
    treatMissingData: 'missing'
  }
}

const DEFAULTS = {
  namespace: 'AWS/Lambda',
  statistic: 'Sum',
  period: 300,
  evaluationPeriods: 2,
  datapointsToAlarm: 1,
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'missing'
}

function resolveAlarmConfig (config) {
  if (config.type && PRESETS[config.type]) {
    return _.merge(PRESETS[config.type], _.omit(['type'], config))
  }
  return _.merge(DEFAULTS, config)
}

function buildCanaryAlarm ({ alarmName, functionName, functionRef, versionName, aliasName, alarmConfig, serviceName, stage }) {
  const resolved = resolveAlarmConfig(alarmConfig)

  if (!resolved.metric) {
    throw new Error('Canary alarm requires a metric name (or use type: "errors" preset)')
  }
  if (resolved.threshold === undefined) {
    throw new Error('Canary alarm requires a threshold value (or use type: "errors" preset)')
  }

  const alarm = {
    Type: 'AWS::CloudWatch::Alarm',
    Properties: {
      AlarmName: {
        'Fn::Sub': `${serviceName}-${stage}-${alarmName}`
      },
      AlarmDescription: `Canary alarm for ${functionName} function`,
      MetricName: resolved.metric,
      Namespace: resolved.namespace,
      Dimensions: [
        {
          Name: 'FunctionName',
          Value: { Ref: functionRef }
        },
        {
          Name: 'Resource',
          Value: {
            'Fn::Join': [':', [{ Ref: functionRef }, aliasName]]
          }
        },
        {
          Name: 'ExecutedVersion',
          Value: { 'Fn::GetAtt': [versionName, 'Version'] }
        }
      ],
      Statistic: resolved.statistic,
      Period: resolved.period,
      EvaluationPeriods: resolved.evaluationPeriods,
      DatapointsToAlarm: resolved.datapointsToAlarm,
      Threshold: resolved.threshold,
      ComparisonOperator: resolved.comparisonOperator,
      TreatMissingData: resolved.treatMissingData
    }
  }

  return alarm
}

function buildCompositeAlarm ({ alarmName, alarmLogicalIds, serviceName, stage }) {
  if (!alarmLogicalIds || alarmLogicalIds.length === 0) {
    throw new Error('Composite alarm requires at least one alarm logical ID')
  }

  const alarmRefs = alarmLogicalIds.map(id => `ALARM(\${${id}})`).join(' OR ')

  const alarm = {
    Type: 'AWS::CloudWatch::CompositeAlarm',
    Properties: {
      AlarmName: {
        'Fn::Sub': `${serviceName}-${stage}-${alarmName}`
      },
      AlarmDescription: 'Stack composite alarm for canary deployments',
      AlarmRule: {
        'Fn::Sub': alarmRefs
      }
    }
  }

  return alarm
}

const CloudWatch = {
  buildCanaryAlarm,
  buildCompositeAlarm,
  resolveAlarmConfig,
  PRESETS,
  DEFAULTS
}

module.exports = CloudWatch
