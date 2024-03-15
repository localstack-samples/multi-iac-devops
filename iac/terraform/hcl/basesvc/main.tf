provider "aws" {
  region                      = var.aws_region
  skip_credentials_validation = var.localstack ? true : false
  skip_requesting_account_id  = var.localstack ? true : false
}


data "terraform_remote_state" "vpc" {
  backend = "s3"

  config = {
    encrypt                     = true
    bucket                      = var.tfstate_bucket_name
    key                         = "basevpc/${var.stack_env}/terraform.tfstate"
    region                      = var.aws_region
    dynamodb_table              = "terraform_locks"
    skip_credentials_validation = var.localstack ? true : false
    skip_requesting_account_id  = var.localstack ? true : false

    access_key = var.localstack ? "test" : null
    secret_key = var.localstack ? "test" : null
    endpoints  = var.localstack ? {
      s3        = "http://s3.localhost.localstack.cloud:4566"
      dynamo_db = "http://localhost:4566"
      iam       = "http://localhost:4566"
      sts       = "http://localhost:4566"
    } : null
  }
}

#

output "vpc_name" {
  value = data.terraform_remote_state.vpc.outputs.base_vpc.name
}