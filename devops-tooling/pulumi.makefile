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

stack-init: iac-shared
	mkdir -p ./global-iac
	pushd $(STACK_DIR) && npm install && popd;
	echo $(PULUMI_BACKEND_URL)
	echo $(PULUMI_CONFIG_PASSPHRASE)
	$(VENV_RUN); $(PULUMI_EXE) stack select -c $(STACK_PREFIX).$(STACK_SUFFIX) --non-interactive --cwd $(STACK_DIR)

up-deploy: venv stack-init stack-init-application
	$(VENV_RUN) && $(PULUMI_EXE) up -ys $(STACK_PREFIX).$(STACK_SUFFIX) --cwd $(STACK_DIR) -v=4

local-pulumi-clean:
	rm -rf global-iac

pulumi-preview: stack-init stack-init-application
	$(VENV_RUN); $(PULUMI_EXE) preview --diff --cwd $(STACK_DIR)

pulumi-outputs: stack-init stack-init-application
	$(VENV_RUN); $(PULUMI_EXE) stack output -s $(STACK_PREFIX).$(STACK_SUFFIX) --cwd $(STACK_DIR) --show-secrets

destroy: stack-init stack-init-application
	$(VENV_RUN); $(PULUMI_EXE) destroy --cwd $(STACK_DIR)

remove: stack-init stack-init-application
	$(VENV_RUN); $(PULUMI_EXE) stack rm $(STACK_PREFIX).$(STACK_SUFFIX) --cwd $(STACK_DIR)

refresh: stack-init stack-init-application
	$(VENV_RUN); $(PULUMI_EXE) refresh -s $(STACK_PREFIX).$(STACK_SUFFIX) --cwd $(STACK_DIR)

cancel: stack-init stack-init-application
	$(VENV_RUN); $(PULUMI_EXE) cancel -s $(STACK_PREFIX).$(STACK_SUFFIX) --cwd $(STACK_DIR)

stack-output: stack-init stack-init-application
	$(VENV_RUN); $(PULUMI_EXE) stack -u -s $(STACK_PREFIX).$(STACK_SUFFIX) --cwd $(STACK_DIR)

# Set Pulumi Configuration here
#
#   Configuration should be added using the template;
#   	$(PULUMI_CONFIG) set <pulumi-variable> $(<makefile-variable>)
#
stack-init-application:
	$(VENV_RUN) && $(PULUMI_CONFIG) set-all \
	--plaintext local_arch=$(ARCH) \
	--plaintext aws_region=$(AWS_REGION) \
	--plaintext aws_account=$(AWS_ACCOUNT) \
	--plaintext aws_account_type=$(AWS_ACCOUNT_TYPE) \
	--plaintext logging_level=$(LOGGING_LEVEL) \
	--plaintext account_json_config=$(ACCOUNT_JSON_CONFIG)

#
# LocalStack Pulumi targets
#
local-pulumi-toplevel-deploy: up-deploy
local-pulumi-toplevel-destroy: destroy
local-pulumi-toplevel-preview: pulumi-preview
local-pulumi-toplevel-outputs: pulumi-outputs