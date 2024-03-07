# Please change the default names as per your requirements.

variable "aws_profile" {
  description = "AWS profile name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "localstack" {
  description = "LocalStack deploy"
  type        = bool
}

variable "cidr_block" {
  default = "10.100.0.0/16"
  type    = string
}

variable "app_name" {
  default = "myapp"
  type    = string
}

variable "stack_env" {
  default = "dev"
  type    = string
}

variable "logging_level" {
  default = "debug"
  type    = string
}

variable "bucket_name" {
  description = "CloudFront S3 Origin bucket name"
  type        = string
}

variable "tfstate_bucket_name" {
  default = "terraform-state"
  type    = string
}

variable "created_by" {
  default = "LocalStack"
  type    = string
}

variable "object_ownership" {
  default = "BucketOwnerPreferred"
  type    = string
}