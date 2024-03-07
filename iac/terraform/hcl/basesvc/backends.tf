terraform {

  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    null = {
      source = "hashicorp/null"
    }
  }

  backend "s3" {
    encrypt        = true
    dynamodb_table = "terraform_locks"
  }
}
