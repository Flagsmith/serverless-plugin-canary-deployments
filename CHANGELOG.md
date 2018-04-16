# 0.4.1 (16.04.2018)
- Add configurable Role for CodeDeploy

# 0.4.0 (09.04.2018)
- Add support for S3 events
- Fix bug that prevented `custom` section in `serverless.yml` to be empty

# 0.3.1 (20.03.2018)
- Fix bug that prevented setting deployment preferences without hooks

# 0.3.0 (13.03.2018)
- Support for SNS events

# 0.2.0 (08.03.2018)
- Support for Stream based events (Kinesis and DynamoDB Streams)
- Add end-to-end tests

# 0.1.0 (24.02.2018)
- Add alias for Lambda functions with deployment settings
- Replace reference to Lambda function `$Latest` version for alias in API Gateway Methods
- Add CodeDeploy support for Lambda gradual deployments
- Add support for traffic shifting hooks
- Add support for CodeDeploy alarms
- Add usage example