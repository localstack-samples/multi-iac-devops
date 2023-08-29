# AWS CDK IaC Instructions

## Prerequisites

Follow the prerequisites in the main [README](../README.md).

1. Install `cdklocal`. See [LocalStack CDK CLI](https://docs.localstack.cloud/user-guide/integrations/aws-cdk/)

```shell
npm install -g aws-cdk-local aws-cdk
```

## Install on LocalStack

### Bootstrap AWS CDK Stacks on LocalStack

You need to do this once.

```shell
make local-awscdk-bootstrap
```

### Deploy VPC Stack on LocalStack

This will deploy a VPC using the configuration in `devops-tooling/accounts`.

```shell
make local-awscdk-vpc-deploy
```

### Deploy App Stack on LocalStack

This will deploy the resources.

```shell
make local-awscdk-deploy
```

