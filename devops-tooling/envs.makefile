VENV_BIN ?= python3 -m venv
# Default virtual env dir
VENV_DIR ?= .venv
VENV_REQS_FILE ?= ./devops-tooling/requirements.txt

PIP_CMD ?= pip3
ifeq ($(OS), Windows_NT)
	VENV_ACTIVATE = ./$(VENV_DIR)/Scripts/activate
else
	VENV_ACTIVATE = ./$(VENV_DIR)/bin/activate
endif

VENV_RUN = . $(VENV_ACTIVATE)
$(VENV_ACTIVATE):
	test -d $(VENV_DIR) || $(VENV_BIN) $(VENV_DIR)
	$(VENV_RUN); $(PIP_CMD) install --upgrade pip
	$(VENV_RUN); $(PIP_CMD) install $(PIP_OPTS) -r ./devops-tooling/requirements.txt
	touch $(VENV_ACTIVATE)


venv-pulumi-pip-install:
	$(VENV_RUN); $(PIP_CMD) install $(PIP_OPTS) -r ./devops-tooling/requirements-pulumi.txt

venv: $(VENV_ACTIVATE)    ## Create a virtual environment
venv-pulumi: $(VENV_ACTIVATE) venv-pulumi-pip-install  ## Create a virtual environment

freeze:                   ## Run pip freeze -l in the virtual environment
	@$(VENV_RUN); pip freeze -l


# default localhost env vars
export LOCALSTACK_ENDPOINT=http://host.docker.internal:4566
export APP_NAME = lsmulti
export APP_VERSION = 0.0.1
export API_VERSION = v1
export AWS_REGION=us-east-1
export IS_LOCAL=true
export LOGGING_LEVEL=DEBUG
export AWS_ACCOUNT=000000000000
export AWS_ACCOUNT_TYPE=LOCALSTACK
export STACK_SUFFIX=local
export CDK_CMD=cdklocal
#export CDK_CMD=cdk
export DOCKER_DEFAULT_PLATFORM=linux/arm64

# Pattern specific variables for each pipeline
# Global local pipeline vars
local%: export ACCOUNT_JSON_CONFIG=../../../../devops-tooling/accounts/localstack.json
local%: export LOCALSTACK=1
# Terraform CDK local pipeline vars
local-cdktf%: export STACK_DIR=iac/terraform/cdk
local-cdktf%: export TFSTACK_NAME=LsMultiEnvApp.$(STACK_SUFFIX)
local-cdktf-vpc%: export TFSTACK_NAME=LsMultiEnvVpc.$(STACK_SUFFIX)

# AWS CDK local pipeline vars
local-awscdk%: export STACK_DIR=iac/awscdk
local-awscdk%: export TFSTACK_NAME=LsMultiEnvApp-$(STACK_SUFFIX)
local-awscdk-vpc%: export TFSTACK_NAME=LsMultiEnvVpc-$(STACK_SUFFIX)

# AWS nonprod env
non%: export IS_LOCAL=false
non%: export LOGGING_LEVEL=INFO
non%: export AWS_ACCOUNT_TYPE=NONPROD
non%: export AWS_REGION=us-east-1
non%: export STACK_SUFFIX=non
non%: export CDK_CMD=cdk
non-cdktf%: export STACK_DIR=iac/terraform/cdk
non-cdktf%: export TFSTACK_NAME=LsMultiEnvApp.$(STACK_SUFFIX)
non-cdktf-vpc%: export TFSTACK_NAME=LsMultiEnvVpc.$(STACK_SUFFIX)

# AWS nonprod env
sbx%: export IS_LOCAL=false
sbx%: export LOGGING_LEVEL=INFO
sbx%: export AWS_ACCOUNT_TYPE=sandbox
sbx%: export AWS_REGION=us-east-1
sbx%: export STACK_SUFFIX=sbx
sbx%: export CDK_CMD=cdk
sbx-cdktf%: export STACK_DIR=iac/terraform/cdk
sbx-cdktf%: export TFSTACK_NAME=LsMultiEnvApp.$(STACK_SUFFIX)
sbx-cdktf-vpc%: export TFSTACK_NAME=LsMultiEnvVpc.$(STACK_SUFFIX)
sbx-cdktf-jump%: export TFSTACK_NAME=LsMultiEnvJump.$(STACK_SUFFIX)

sbx-awscdk%: export STACK_DIR=iac/awscdk
sbx-awscdk%: export TFSTACK_NAME=LsMultiEnvApp-$(STACK_SUFFIX)
sbx-awscdk-vpc%: export TFSTACK_NAME=LsMultiEnvVpc-$(STACK_SUFFIX)


uname_m := $(shell uname -m) # store the output of the command in a variable
export LOCAL_ARCH=$(uname_m)
export ARCH=$(uname_m)

export MAPPING_DIR_NAME=$(PWD)
