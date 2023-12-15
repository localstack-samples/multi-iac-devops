#!/bin/bash

# Setup AWS CDK stacks
make local-awscdk-bootstrap
make local-awscdk-deploy

# Test AWS CDK stacks
make local-awscdk-test
make local-awscdk-invoke

# Cleanup
make local-awscdk-destroy
make local-awscdk-clean
