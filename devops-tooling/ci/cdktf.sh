#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Setup Terraform stacks
make local-cdktf-install
make local-cdktf-vpc-deploy
make local-cdktf-deploy

# Test Terraform stacks
make local-cdktf-test
make local-cdktf-invoke

# Cleanup
make local-cdktf-destroy
make local-cdktf-clean
