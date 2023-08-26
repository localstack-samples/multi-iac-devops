SHELL := /bin/bash

-include .env-gdc-local
-include ./devops-tooling/envs.makefile
-include ./devops-tooling/nonenv.makefile
-include ./devops-tooling/pulumi.makefile
-include ./devops-tooling/cdktf.makefile

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

build:
	cd src/lambda-hello-name && npm install
	cd src/lambda-hello-name && npm run compile

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

