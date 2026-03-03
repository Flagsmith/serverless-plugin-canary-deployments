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

function isMetricMathConfig (config) {
  return Array.isArray(config.metrics) && config.metrics.length > 0 && typeof config.expression === 'string' && config.expression.length > 0
}

function resolveAlarmConfig (config) {
  if (config.preset && PRESETS[config.preset]) {
    return _.merge(PRESETS[config.preset], _.omit(['preset'], config))
  }
  return _.merge(DEFAULTS, config)
}

function resolveMetricMathConfig (config) {
  const defaults = {
    namespace: DEFAULTS.namespace,
    period: DEFAULTS.period,
    evaluationPeriods: DEFAULTS.evaluationPeriods,
    datapointsToAlarm: DEFAULTS.datapointsToAlarm,
    comparisonOperator: DEFAULTS.comparisonOperator,
    treatMissingData: DEFAULTS.treatMissingData
  }
  return _.merge(defaults, config)
}

function buildMetricMathAlarm ({ alarmName, functionName, functionRef, versionName, aliasName, alarmConfig, serviceName, stage }) {
  const resolved = resolveMetricMathConfig(alarmConfig)

  const dimensions = [
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
  ]

  const metricQueries = resolved.metrics.map(m => ({
    Id: m.id,
    MetricStat: {
      Metric: {
        MetricName: m.metric,
        Namespace: resolved.namespace,
        Dimensions: dimensions
      },
      Period: resolved.period,
      Stat: m.statistic
    },
    ReturnData: false
  }))

  metricQueries.push({
    Id: 'expr',
    Expression: resolved.expression,
    ReturnData: true
  })

  return {
    Type: 'AWS::CloudWatch::Alarm',
    Properties: {
      AlarmName: {
        'Fn::Sub': `${serviceName}-${stage}-${alarmName}-v\${${versionName}.Version}`
      },
      AlarmDescription: `Canary alarm for ${functionName} function`,
      Metrics: metricQueries,
      EvaluationPeriods: resolved.evaluationPeriods,
      DatapointsToAlarm: resolved.datapointsToAlarm,
      Threshold: resolved.threshold,
      ComparisonOperator: resolved.comparisonOperator,
      TreatMissingData: resolved.treatMissingData
    }
  }
}

function buildCanaryAlarm ({ alarmName, functionName, functionRef, versionName, aliasName, alarmConfig, serviceName, stage }) {
  if (isMetricMathConfig(alarmConfig)) {
    return buildMetricMathAlarm({ alarmName, functionName, functionRef, versionName, aliasName, alarmConfig, serviceName, stage })
  }

  const resolved = resolveAlarmConfig(alarmConfig)

  if (!resolved.metric) {
    throw new Error('Canary alarm requires a metric name (or use preset: "errors")')
  }
  if (resolved.threshold === undefined || typeof resolved.threshold !== 'number') {
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

function buildCompositeAlarm ({ alarmName, alarmLogicalIds = [], serviceName, stage }) {
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
  buildMetricMathAlarm,
  resolveAlarmConfig,
  resolveMetricMathConfig,
  isMetricMathConfig,
  PRESETS,
  DEFAULTS
}

module.exports = CloudWatch
