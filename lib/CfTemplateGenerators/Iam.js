const _ = require('lodash/fp')

function buildCodeDeployRole (codeDeployRolePermissionsBoundaryArn, areTriggerConfigurationsSet) {
  const attachedPolicies = [
    'service-role/AWSCodeDeployRoleForLambdaLimited',
    'AWSLambda_FullAccess'
  ]
  if (areTriggerConfigurationsSet) {
    attachedPolicies.push('AmazonSNSFullAccess')
  }
  const iamRoleCodeDeploy = {
    Type: 'AWS::IAM::Role',
    Properties: {
      ManagedPolicyArns: attachedPolicies.map(policy => ({
        'Fn::Sub': `arn:\${AWS::Partition}:iam::aws:policy/${policy}`
      })),
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['sts:AssumeRole'],
            Effect: 'Allow',
            Principal: { Service: ['codedeploy.amazonaws.com'] }
          }
        ]
      }
    }
  }
  if (codeDeployRolePermissionsBoundaryArn) {
    Object.assign(iamRoleCodeDeploy.Properties, { PermissionsBoundary: codeDeployRolePermissionsBoundaryArn })
  }
  return iamRoleCodeDeploy
}

function buildExecutionRoleWithCodeDeploy (inputRole, codeDeployAppName, deploymentGroups) {
  if (deploymentGroups.length === 0) {
    return inputRole
  }

  const outputRole = _.cloneDeep(inputRole)

  const statement = _.prop('Properties.Policies.0.PolicyDocument.Statement', outputRole)
  if (!statement) {
    return inputRole
  }

  statement.push({
    Action: ['codedeploy:PutLifecycleEventHookExecutionStatus'],
    Effect: 'Allow',
    Resource: deploymentGroups.map(deploymentGroup => ({
      'Fn::Sub': `arn:\${AWS::Partition}:codedeploy:\${AWS::Region}:\${AWS::AccountId}:deploymentgroup:\${${codeDeployAppName}}/${deploymentGroup}`
    }))
  })

  return outputRole
}

const Iam = {
  buildCodeDeployRole,
  buildExecutionRoleWithCodeDeploy
}

module.exports = Iam
