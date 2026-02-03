const _ = require('lodash/fp')

const PRESETS = {
  errors: {
    metric: 'Errors',
    namespace: 'AWS/Lambda',
    statistic: 'Sum',
    period: 60,
    evaluationPeriods: 1,
    datapointsToAlarm: 1,
    threshold: 1000,
    comparisonOperator: 'GreaterThanThreshold',
    treatMissingData: 'notBreaching'
  }
}

const DEFAULTS = {
  namespace: 'AWS/Lambda',
  statistic: 'Sum',
  period: 60,
  evaluationPeriods: 1,
  datapointsToAlarm: 1,
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching'
}

function resolveAlarmConfig (config) {
  if (config.preset && PRESETS[config.preset]) {
    return _.merge(PRESETS[config.preset], _.omit(['preset'], config))
  }
  return _.merge(DEFAULTS, config)
}

function buildCanaryAlarm ({ alarmName, functionName, functionRef, versionName, aliasName, alarmConfig, serviceName, stage }) {
  const resolved = resolveAlarmConfig(alarmConfig)

  if (!resolved.metric) {
    throw new Error('Canary alarm requires a metric name (or use preset: "errors")')
  }
  if (resolved.threshold === undefined) {
    throw new Error('Canary alarm requires a threshold value (or use preset: "errors")')
  }

  const alarm = {
    Type: 'AWS::CloudWatch::Alarm',
    Properties: {
      // Include version in name to force CloudFormation replacement, avoiding stale ALARM state
      AlarmName: {
        'Fn::Sub': `${serviceName}-${stage}-${alarmName}-v\${${versionName}.Version}`
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
