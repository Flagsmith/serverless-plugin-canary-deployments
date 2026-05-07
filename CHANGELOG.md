# Changelog

## [1.1.0](https://github.com/Flagsmith/serverless-plugin-canary-deployments/compare/v1.0.0...v1.1.0) (2026-05-07)


### Features

* Support Metric Math alarms ([#63](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/63)) ([d0b9264](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/d0b92640a9633a103403831dd51c6a370de667ae))


### Bug Fixes

* Hardcoded partition component in ARNs ([#75](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/75)) ([f52570a](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/f52570a28cfae676a73f3032109036918624fda1))


### CI

* integrate release-please and align Dependabot prefix ([#81](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/81)) ([8f22d76](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/8f22d766950e157f09ecece4460601c614f7f415))


### Other

* **deps-dev:** bump axios from 1.13.2 to 1.15.0 ([#73](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/73)) ([715c117](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/715c117395513b57943f8c2a1834c23caa470b1e))
* **deps-dev:** bump axios from 1.15.0 to 1.16.0 ([#77](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/77)) ([94e26cc](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/94e26cc8679b87a70a9c388d4d72bd1e85614e1c))
* **deps-dev:** bump flatted from 3.3.3 to 3.4.2 ([#68](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/68)) ([9376bda](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/9376bdadc98be18b884293ce3d511b0e56cd174b))
* **deps-dev:** bump follow-redirects from 1.15.11 to 1.16.0 ([#74](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/74)) ([87fbb8a](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/87fbb8a27989ce0b526a7c11cfdee7af4add6d44))
* **deps-dev:** bump minimatch from 3.1.2 to 3.1.5 ([#61](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/61)) ([f35ed8c](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/f35ed8c1652ddde473a0444d4f6ee5dc83685fb6))
* **deps-dev:** bump picomatch from 2.3.1 to 2.3.2 ([#71](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/71)) ([2089a68](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/2089a6829ba9a5698a756b1d04fa2c295309d768))
* **deps-dev:** bump qs from 6.14.1 to 6.14.2 ([#58](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/58)) ([7089076](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/7089076c12d6e1ee2ae2e57162111e10bda11024))
* **deps-dev:** bump simple-git from 3.30.0 to 3.33.0 ([#65](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/65)) ([1c9b1cc](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/1c9b1cc222451285a12f9ae381f8c7338c962cdc))
* **deps-dev:** bump simple-git from 3.33.0 to 3.36.0 ([#78](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/78)) ([ddb501f](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/ddb501f716b47c5fc5cea0437b2065700929d3d1))
* **deps:** bump fast-xml-parser and @aws-sdk/xml-builder ([#79](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/79)) ([c742c4c](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/c742c4c0aedb00f74831fc81733dc047cab3e083))
* **deps:** bump fast-xml-parser, @aws-sdk/client-api-gateway, @aws-sdk/client-cognito-identity-provider, @aws-sdk/client-eventbridge, @aws-sdk/client-iam, @aws-sdk/client-lambda, @aws-sdk/client-s3, @aws-sdk/client-cloudformation and @aws-sdk/client-sts ([#69](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/69)) ([c1a9145](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/c1a91456360db022ddf34422fc47152d0fe084e2))
* **deps:** bump lodash from 4.17.23 to 4.18.1 ([#72](https://github.com/Flagsmith/serverless-plugin-canary-deployments/issues/72)) ([b6f6ae7](https://github.com/Flagsmith/serverless-plugin-canary-deployments/commit/b6f6ae743bd085391bddca0cb9751e706656887c))

## 0.8.0 (11.04.2022)
- Add support for AppSync #144

## 0.7.1 (14.11.2021)
- Truncate deployment group name to 100 characters #139
- Add lambda permission to support function name ref #141

## 0.7.0 (09.09.2021)
- Generate a Deployment Group Name in the format of ${stackName}-${logicalId} to avoid a circular dependency when used with the aws-alerts plugin #135

## 0.6.0 (31.03.2021)
- Add config validator #102
- Replace deprecated AWS managed policy for codedeploy #116

## 0.5.0 (09.02.2021)
- Add support for API Gateway v2 #72
- Update CodeDeploy default policy to AWSCodeDeployRoleForLambdaLimited #98
- Add support for IAM permissions boundaries #99
- Patch in CodeDeploy permissions for hooks #110

## 0.4.8 (28.07.2019)
- Add support for IoT rules

## 0.4.7 (01.04.2019)
- Add support for CloudWatch Logs events
- Add support for SNS Subscriptions with filter policies

## 0.4.6 (14.02.2019)
- Add support for CloudWatch Events

## 0.4.5 (14.01.2019)
- Allow configuring CodeDeploy triggers

## 0.4.4 (12.12.2018)
- Add compatibility with `serverless-plugin-split-stacks`

## 0.4.3 (21.10.2018)
- Allow referencing alarms by their name

## 0.4.2 (18.04.2018)
- Add configuration for enabling canary deployments on a per stage basis

## 0.4.1 (16.04.2018)
- Add configurable Role for CodeDeploy

## 0.4.0 (09.04.2018)
- Add support for S3 events
- Fix bug that prevented `custom` section in `serverless.yml` to be empty

## 0.3.1 (20.03.2018)
- Fix bug that prevented setting deployment preferences without hooks

## 0.3.0 (13.03.2018)
- Support for SNS events

## 0.2.0 (08.03.2018)
- Support for Stream based events (Kinesis and DynamoDB Streams)
- Add end-to-end tests

## 0.1.0 (24.02.2018)
- Add alias for Lambda functions with deployment settings
- Replace reference to Lambda function `$Latest` version for alias in API Gateway Methods
- Add CodeDeploy support for Lambda gradual deployments
- Add support for traffic shifting hooks
- Add support for CodeDeploy alarms
- Add usage example
