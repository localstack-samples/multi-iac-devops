terraform {

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.20.0"
    }
    null = {
      source = "hashicorp/null"
    }
  }

  backend "s3" {
    encrypt = true

  }
}
