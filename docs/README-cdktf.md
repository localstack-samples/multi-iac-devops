# Terraform CDK IaC Instructions

### Overview of Terraform CDK Pipeline make targets

Follow instructions in the READMEs.

- make local-cdktf-install
- make local-cdktf-vpc-deploy
- make local-cdktf-deploy
- make local-cdktf-test
- make local-cdktf-invoke
- make local-cdktf-clean

**AWS targets**

- make sbx-cdktf-install
- make sbx-cdktf-vpc-deploy
- make sbx-cdktf-deploy
- make sbx-cdktf-jump-deploy (deploy jumphost in private VPC subnet)
- make sbx-cdktf-jump-destroy
- make sbx-cdktf-destroy
- make sbx-cdktf-vpc-destroy

### Install CDKTF packages

You need to do this initially, and if you manually add packages to `iac/terraform/cdk/package.json`

```shell
make local-cdktf-install
```

### Deploy VPC Stack on LocalStack

This will deploy a VPC using the configuration in `devops-tooling/accounts`.

```shell
make local-cdktf-vpc-deploy
```

*Note: the above command will fail if it has been applied on a previous instance of Localstack unless `make local-cdktf-clean` is run before.*

### Deploy App Stack on LocalStack

This will deploy the resources.

```shell
make local-cdktf-deploy
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
make local-cdktf-test
```

After you run the tests once, you don't have to save the IaC output again, so you can just run this and save some time.

```shell
make test
```

## Invoke API Gateway on LocalStack

```shell
make local-cdktf-invoke
```

## Cleanup Local Env

```shell
make local-cdktf-clean
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

1. In the file `.env-gdc-local` that you created in the Setup instructions in the main README, add an entry
   for `SBX_ACCOUNT_CONFIG` that points to a file in the `./devops-tooling/accounts` directory named something
   like `my-sb-yourname.json`. And add this entry to `.env-gdc-local`. Fill in the appropriate values that have
   placeholders in the `devops-tooling/accounts/my-sb.json` file.

```shell
export SBX_ACCOUNT_CONFIG=devops-tooling/accounts/my-sb-yourname.json
```

Configure a Sandbox VPC in `my-sb-yourname.json`. Change the CIDR block to your preferences.

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

### Deploy the Terraform CDK IaC App Stack

This will deploy the resources.

```shell
make sbx-cdktf-deploy
```

### Deploy Jumphost to Private VPC

```shell
make sbx-cdktf-jump-deploy
```

This will output the EC2 ID. You can connect to this EC2 instance by

1. Install the AWS Systems Manager
   Plugin [https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html]
2. Clone the GDC to get the `ssm-ssh.sh` script. [https://gitlab.com/probello/generic-dev-container]
3. Use this script to login to the EC2 instance like
   this [https://gitlab.com/probello/generic-dev-container/-/blob/main/root/bin/aws/ssm-ssh.sh?ref_type=heads]

```shell
# Get AWS credentials
ssm-ssh.sh <ec2 instance id>
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