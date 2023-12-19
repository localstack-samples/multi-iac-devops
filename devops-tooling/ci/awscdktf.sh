#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Create AWS config/credentials
make setup-aws

export AWS_PROFILE=localstack
export AWS_CONFIG_FILE=/root/.aws/config
export AWS_SHARED_CREDENTIALS_FILE=/root/.aws/credentials

# The endpoint is not getting picked up from the profile in the config file.
export AWS_ENDPOINT_URL="http://${ENDPOINT_HOST}:4566"

# Setup Terraform stacks
make local-cdktf-install
make local-cdktf-clean
make local-cdktf-vpc-deploy
make local-cdktf-deploy

# Test Terraform stacks
make local-cdktf-test
make local-cdktf-invoke

# Cleanup
make local-cdktf-destroy
make local-cdktf-clean

curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"action": "kill"}' \
     http://${ENDPOINT_HOST}:4566/_localstack/health
