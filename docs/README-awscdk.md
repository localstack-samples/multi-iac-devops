# AWS CDK IaC Instructions

The AWS CDK code can be found in `./iac/awscdk`. The CDK App definition
that defines all of the Stacks is located in `./iac/awscdk/bin/awscdk.ts`.
The App instantiates the Stacks defined in `./iac/awscdk/lib/awscdk-stacks.ts`.

### Overview of AWS CDK Pipeline make targets

Follow instructions in the READMEs.

- make local-awscdk-bootstrap
- make local-awscdk-deploy
- make local-awscdk-invoke
- make local-awscdk-invoke-loop
- make local-awscdk-test
- make local-awscdk-clean

**AWS targets**

- make sbx-awscdk-bootstrap
- make sbx-awscdk-deploy
- make sbx-awscdk-clean

## Prerequisites

Follow the prerequisites in the main [README](../README.md).

1. Install `cdklocal`. See [LocalStack CDK CLI](https://docs.localstack.cloud/user-guide/integrations/aws-cdk/)

```shell
npm install -g aws-cdk-local aws-cdk
```

# Deploy

## Start LocalStack

```shell
make start-localstack
```

## Install on LocalStack

### Bootstrap AWS CDK Stacks on LocalStack

You need to do this once.

```shell
make local-awscdk-bootstrap
```

### Deploy App Stack on LocalStack

This will deploy the resources.

```shell
make local-awscdk-deploy
```

## Testing and Hot Reloading!

The Lambda is setup for hot reloading in this project on LocalStack by default. After everything is deployed by
following one of complete
IaC deployments above, you can work with the Lambda in hot-reload mode.
See [LocalStack Hot Reloading](https://docs.localstack.cloud/user-guide/tools/lambda-tools/hot-reloading)

Now, your DevX looks like a rapid TDD cycle. There's a test in `auto_tests/test_apigw_name.py`.

Run watchman to do a build whenever code changes in the Lambda.
Change the Lambda in `./src/lambda-hello-name/src`. It'll recompile and redeploy on the fly. Then rerun the tests.

```shell
make watch-lambda
```

Then run the test(s)

## Run Integration Tests against LocalStack

```shell
make test-awscdk
```

## Invoke API Gateway on LocalStack

```shell
make local-awscdk-invoke
```

## Cleanup Local Env

```shell
make local-awscdk-clean
```

# AWS Deploy Instructions

We use the same IaC pipelines to deploy to AWS! This is a very important point that LocalStack enables teams
to test their IaC pipelines locally before ever deploying them to a live AWS environment.

## Set Live AWS Credentials

However you set your credentials in your terminal, do it now.

### Deploy the AWS CDK IaC App Stack

Run the CDK bootstrap:

```shell
make sbx-awscdk-bootstrap
```

This will deploy the resources.

```shell
make sbx-awscdk-deploy
```

### Invoke the Lambda in AWS

```shell
make sbx-awscdk-invoke
```

### Destroy the CDK Stack in AWS

```shell
make sbx-awscdk-destroy
```
