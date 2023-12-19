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

# Setup AWS CDK stacks
make local-awscdk-bootstrap
make local-awscdk-deploy

# Test AWS CDK stacks
make local-awscdk-test
make local-awscdk-invoke

# Cleanup
make local-awscdk-destroy
make local-awscdk-clean

curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"action": "kill"}' \
     http://${ENDPOINT_HOST}:4566/_localstack/health
