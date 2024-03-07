provider "aws" {
  region                      = var.aws_region
  skip_credentials_validation = var.localstack ? true : false
  skip_requesting_account_id  = var.localstack ? true : false
}


# Create a VPC in 3 AZs with public and private subnets, 1 NAT Gateway, and 1 Internet Gateway
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "basevpc"
  cidr = "10.100.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d"]
  private_subnets = ["10.100.1.0/24", "10.100.2.0/24", "10.100.3.0/24", "10.100.4.0/24"]
  public_subnets  = ["10.100.101.0/24", "10.100.102.0/24", "10.100.103.0/24", "10.100.104.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
  enable_vpn_gateway = false

  tags = {
    Terraform   = "true"
    Environment = "dev"
    Name        = "basevpc"
  }
}
#
output "vpc_name" {
  value = module.vpc.name
}