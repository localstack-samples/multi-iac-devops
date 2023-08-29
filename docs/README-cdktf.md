# Terraform CDK IaC Instructions

### Install pipeline packages

You need to do this initially, and if you manually add packages to `iac/terraform/cdk/package.json`

```shell
make local-cdktf-install
```

### Deploy the Terraform CDK IaC VPC Stack

This will deploy a VPC using the configuration in `devops-tooling/accounts`.

```shell
make local-cdktf-vpc-deploy
```

### Deploy the Terraform CDK IaC API Gateway Stack

This will deploy the resources.

```shell
make local-cdktf-deploy
```

## Testing and Hot Reloading!

The Lambda is setup for hot reloading in this project on LocalStack by default. After everything is deployed by
following one of complete
IaC deployments above, you can work with the Lambda in hot-reload mode.
See [LocalStack Hot Reloading](https://docs.localstack.cloud/user-guide/tools/lambda-tools/hot-reloading)

Now, your DevX looks like a rapid TDD cycle. There's a test in `auto_tests/test_apigw_name.py`. Run watchman to do a
build whenever code changes in the Lambda.

```shell
make watch-lambda
```

Then run the test(s)

```shell
make test-cdktf
```

After you run the tests once, you don't have to save the IaC output again, so you can just run this and save some time.

```shell
make test-cdktf-bare
```

## Cleanup Local Env

```shell
make local-clean-cdktf
```

# AWS Deploy Instructions

We use the same IaC pipelines to deploy to AWS! This is a very important point that LocalStack enables teams
to test their IaC pipelines locally before ever deploying them to a live AWS environment.

## Set Live AWS Credentials

However you set your credentials in your terminal, do it now.

## Add Environment Config

This project stores Terraform state in an AWS S3 bucket in the target account.
Create an S3 bucket in your target account to hold the Terraform state

```shell
aws s3 mb s3://<name of your bucket>-<region where bucket is> --region <region where your bucket is>
# enable versioning in case of state corruption
aws s3api put-bucket-versioning --bucket <your full bucket name> --versioning-configuration Status=Enabled
```

Create a file called `sandboxenv.makefile` at the root of this project.

```makefile
sbx%: export TERRAFORM_STATE_BUCKET=<your bucket name. ie my-happy-bucket-us-east-1>
sbx%: export PULUMI_BACKEND_URL=s3://$(TERRAFORM_STATE_BUCKET)
```

### Create VPC Config for Sandbox

Create a file `./devops-tooling/accounts/my-sb.json`.
Configure a Sandbox VPC. Change the CIDR block to your preferences.

```json
{
  "accountNum": "<YOUR AWS ACCOUNT ID HERE>",
  "accountName": "mysb",
  "description": "My Sandbox VPC",
  "regions": [
    {
      "region": "us-east-1",
      "accountType": "sandbox",
      "vpcName": "mysb",
      "vpcConfig": {
        "cidrBlock": "10.42.0.0/16",
        "numberOfAvailabilityZones": 4,
        "subnetCidrMask": 20
      }
    }
  ]
}

```

### Deploy the Terraform CDK IaC VPC Stack

This will deploy a VPC using the configuration in `devops-tooling/accounts`.

```shell
make sbx-cdktf-vpc-deploy
```

### Deploy the Terraform CDK IaC API Gateway Stack

This will deploy the resources.

```shell
make sbx-cdktf-deploy
```

### Invoke the Lambda in AWS

```shell
make sbx-cdktf-invoke
```

Now you can invoke it again and view the new output.

## Destroy the Deployed Stack

```shell
make sbx-cdktf-destroy
```

```shell
make sbx-cdktf-vpc-destroy
```