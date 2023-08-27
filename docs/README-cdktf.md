## Terraform CDK IaC Instructions

### Install pipeline packages

You need to do this initially, and if you manually add packages to `iac/terraform/cdk/package.json`

```shell
make local-cdktf-install
```

### Deploy the Terraform CDK IaC Stack

This will deploy the S3 bucket, Lambda in hot reload mode, all roles and policies.

```shell
make local-cdktf-deploy
```