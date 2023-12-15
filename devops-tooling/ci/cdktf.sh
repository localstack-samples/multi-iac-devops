#!/bin/bash

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
