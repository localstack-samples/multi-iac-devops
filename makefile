SHELL := /bin/bash

PROJECT_MODULE_NAME = ./src/lambda-hello-name/src/

-include .env-gdc-local
-include ./devops-tooling/envs.makefile
-include ./devops-tooling/nonenv.makefile
-include ./devops-tooling/sandboxenv.makefile
-include ./devops-tooling/pulumi.makefile
-include ./devops-tooling/cdktf.makefile
-include ./devops-tooling/awscdk.makefile

# Some defaults
export SBX_ACCOUNT_CONFIG?=devops-tooling/accounts/my-sb.json
export ENFORCE_IAM?=1

.PHONY: clean update-deps delete-zips iac-shared local-top-level

PKG_SUB_DIRS := $(dir $(shell find . -type d -name node_modules -prune -o -type d -name "venv*" -prune -o -type f -name package.json -print))

PULUMI_CONFIG = $(PULUMI_EXE) config --stack $(STACK_PREFIX).$(STACK_SUFFIX) --cwd $(STACK_DIR)

update-deps: $(PKG_SUB_DIRS)
	for i in $(PKG_SUB_DIRS); do \
        pushd $$i && ncu -u && npm install && popd; \
    done

start-localstack:
	cd devops-tooling && docker compose -p $(APP_NAME) up


start-localstack-pro:
	cd devops-tooling && docker compose -p $(APP_NAME)-pro -f docker-compose-pro.yml up

start-localstack-splunk:
	cd devops-tooling && docker compose -p $(APP_NAME)-splunk -f docker-compose-splunk.yml up

stop-localstack:
	cd devops-tooling && docker compose down

iac-shared:
	pushd iac/iac-shared && npm install && npm run build && popd

build:
	cd src/lambda-hello-name && npm install
	cd src/lambda-hello-name && npm run build
	cd src/common_layer && make

# Hot reloading watching to run build
watch-lambda:
	cd src/lambda-hello-name && npm run watch

# Run the tests
test:
	$(VENV_RUN) && cd auto_tests && AWS_PROFILE=localstack pytest $(ARGS);

hp:
	@echo $(HOST_PROJECT_PATH)