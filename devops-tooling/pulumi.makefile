# Default values
export PULUMI_CONFIG_PASSPHRASE ?= sample-432
export PULUMI_BACKEND_URL ?= file://$(shell pwd)/global-iac
export PULUMI_EXE=pulumi

# Virtual env dir for pulumi
local-pulumi-%: export VENV_DIR=.venv-pulumi
non-pulumi-%: export VENV_DIR=.venv-pulumi
# Use LocalStack provider wrapper locally
local%: export PULUMI_EXE=pulumilocal
local-pulumi-toplevel%: export STACK_DIR=iac/pulumi/typescript/top-level
local-pulumi-toplevel%: export STACK_PREFIX=toplevel
local-pulumi-toplevel%: export VPC_CIDR_BLOCK=10.10.0.0/16

#local-pulumi%: export PULUMI_STACK_NAME=$(STACK_PREFIX).$(STACK_SUFFIX)


local-pulumi-env: venv
	echo $(PULUMI_BACKEND_URL)
	echo $(PULUMI_CONFIG_PASSPHRASE)

local-pulumi-toplevel-deploy: up-deploy
local-pulumi-toplevel-destroy: destroy
local-pulumi-toplevel-preview: pulumi-preview
local-pulumi-toplevel-outputs: pulumi-outputs