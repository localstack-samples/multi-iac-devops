#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Create AWS config/credentials
make setup-aws

# Setup AWS CDK stacks
make local-awscdk-bootstrap
make local-awscdk-deploy

# Test AWS CDK stacks
make local-awscdk-test
make local-awscdk-invoke

# Cleanup
make local-awscdk-destroy
make local-awscdk-clean
