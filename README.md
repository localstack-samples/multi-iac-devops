# Multi-IaC Pipeline ECS Solution

Example with multiple IaC pipelines to setup infrastructure, platform, and an ECS solution.

## E2E S3 Solution

![Basic Solution](./docs/img/solution-diags-overview.drawio.png "Basic Solution")

## Cloud Infrastructure, Platform, Solution Layers

![Cloud Arch Layers](./docs/img/solution-diags-layers.drawio.png "Cloud Arch Layers")

# Deploying the App to LocalStack

To deploy your infrastructure, follow the steps below.

### Prerequisites

1. [Install Watchman](https://facebook.github.io/watchman/)
2. [Install LATEST AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
3. [Install Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)
4. [Install JQ](https://jqlang.github.io/jq/download/)


5. Install Node Version Manager (NVM)
   https://github.com/nvm-sh/nvm#installing-and-updating

6. Select Node version 18

```shell
nvm install 18
```

7. Install Terraform CDK
   Install cdktf in the node 18 version you just installed in step (4).

```shell
npm install --global cdktf-cli@latest
```

### Steps

After cloning this repo, from this working directory, run these commands:

1. Set your LocalStack pro key

      ```bash
      export LOCALSTACK_API_KEY=<your key>
      ```

2. Start LocalStack

      ```bash
      make start-localstack
      ```

![Start LocalStack](./docs/img/start-localstack.png "Start LocalStack")

3. Setup an AWS_PROFILE for LocalStack

#### Add this to your `~/.aws/config` file

```text
[profile localstack]
region=us-east-1
output=json
endpoint_url = http://localhost:4566
```

#### Add this to your `~/.aws/credentials` file

```text
[localstack]
aws_access_key_id=test
aws_secret_access_key=test
```

# IaC Pipelines

## Terraform CDK Instructions

[Solution Guide for Terrform CDK](./docs/README-cdktf.md "Solution Guide for TerraformCDK")

## AWS CDK (Work in Progress)

[Solution Guide for AWS CDK](./docs/README-awscdk.md "Solution Guide for AWS CDK")

## Pulumi Instructions (Work in Progress)

[Solution Guide for Pulumi](./docs/README-pulumi.md "Solution Guide for Pulumi")