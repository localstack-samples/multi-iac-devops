SHELL := /bin/bash

-include ./devops-tooling/envs.makefile
-include ./devops-tooling/nonenv.makefile
-include ./devops-tooling/pulumi.makefile

.PHONY: clean update-deps delete-zips iac-shared local-top-level

PKG_SUB_DIRS := $(dir $(shell find . -type d -name node_modules -prune -o -type d -name "venv*" -prune -o -type f -name package.json -print))

PULUMI_CONFIG = $(PULUMI_EXE) config --stack $(STACK_PREFIX).$(STACK_SUFFIX) --cwd $(STACK_DIR)

update-deps: $(PKG_SUB_DIRS)
	for i in $(PKG_SUB_DIRS); do \
        pushd $$i && ncu -u && npm install && popd; \
    done

start-localstack:
	cd devops-tooling && docker compose -p $(APP_NAME) up

stop-localstack:
	cd devops-tooling && docker compose down

#
#local-destroy-all:
#	make local-ecr-destroy
#	make local-toplevel-destroy

iac-shared:
	pushd $(STACK_DIR)/../iac-shared && npm install && npm run build && popd

cdktfdeploy:
	cd $(STACK_DIR) && cdktf deploy $(TFSTACK_NAME)

cdktfdestroy:
	cd $(STACK_DIR) && cdktf destroy $(TFSTACK_NAME)

cdktfinstall:
	cd $(STACK_DIR) && npm install

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
	--plaintext local_arch=$(LOCAL_ARCH) \
	--plaintext aws_region=$(AWS_REGION) \
	--plaintext aws_account=$(AWS_ACCOUNT) \
	--plaintext aws_account_type=$(AWS_ACCOUNT_TYPE) \
	--plaintext logging_level=$(LOGGING_LEVEL) \
	--plaintext account_json_config=$(ACCOUNT_JSON_CONFIG)


# Setup python
setup-venv: requirements-dev.txt
	/usr/local/pyenv/shims/python3 -m venv --clear venv
	( \
	source venv/bin/activate; \
	python3 -m pip install --upgrade pip; \
	pip3 install -r requirements-dev.txt; \
	);

reset:
	- stop-ls.sh
	- rm iac/Pulumi.*.yaml
	- rm -rf ./global-iac/.pulumi
	- rm -rf iac/.pulumi
	- start-ls.sh

it-again: reset
	make local-toplevel-deploy
	make local-ecr-deploy

