SHELL := /bin/bash

PROJECT_MODULE_NAME = ./src/lambda-hello-name/src/

export ARCHITECTURE=$(shell uname -m | sed 's/amd64/x86_64/')
ifneq ($(ARCHITECTURE), x86_64)
	export ARCHITECTURE := arm64
endif

-include .env-gdc-local
-include ./devops-tooling/envs.makefile
-include ./devops-tooling/nonenv.makefile
-include ./devops-tooling/sandboxenv.makefile
-include ./devops-tooling/pulumi.makefile
-include ./devops-tooling/cdktf.makefile
-include ./devops-tooling/awscdk.makefile
-include ./devops-tooling/tf.makefile
-include ./devops-tooling/tf-cloudfront-s3.makefile
-include ./devops-tooling/tf-basevpc.makefile
-include ./devops-tooling/tf-basesvc.makefile

# Some defaults
export SBX_ACCOUNT_CONFIG?=devops-tooling/accounts/my-sb.json
export ENFORCE_IAM?=1
export HOST_PROJECT_PATH ?= $(PWD)
export MAPPING_DIR_NAME ?= /workspace

.PHONY: clean update-deps delete-zips iac-shared local-top-level

PKG_SUB_DIRS := $(dir $(shell find . -type d -name node_modules -prune -o -type d -name "venv*" -prune -o -type f -name package.json -print))

PULUMI_CONFIG = $(PULUMI_EXE) config --stack $(STACK_PREFIX).$(STACK_SUFFIX) --cwd $(STACK_DIR)

export ENDPOINT_HOST ?= localhost.localstack.cloud

DOCKER_COMPOSE_FLAGS ?=

##################################################
# Targets that can be run from the command line.

update-deps: $(PKG_SUB_DIRS)
	for i in $(PKG_SUB_DIRS); do \
        pushd $$i && ncu -u && npm install && popd; \
    done

setup-aws:
	mkdir -p ~/.aws
	touch ~/.aws/config ~/.aws/credentials
	@if ! grep -q '\[profile localstack\]' ~/.aws/config ; then \
		echo "[profile localstack]" >> ~/.aws/config; \
		echo "region=us-east-1" >> ~/.aws/config; \
		echo "output=json" >> ~/.aws/config; \
		echo "endpoint_url = http://localhost.localstack.cloud:4566" >> ~/.aws/config; \
	fi
	@if ! grep -q '\[localstack\]' ~/.aws/credentials ; then \
		echo "[localstack]" >> ~/.aws/credentials; \
		echo "aws_access_key_id=test" >> ~/.aws/credentials; \
		echo "aws_secret_access_key=test" >> ~/.aws/credentials; \
	fi

start-localstack:
	@ARCHITECTURE=$(ARCHITECTURE); \
    if [ "$$ARCHITECTURE" = "x86_64" ]; then \
        cd devops-tooling && docker compose -f docker-compose.localstack.yml -f docker-compose.amd64_localstack.yml -p $(APP_NAME) up $(DOCKER_COMPOSE_FLAGS); \
    else \
        cd devops-tooling && docker compose -f docker-compose.localstack.yml -p $(APP_NAME) up $(DOCKER_COMPOSE_FLAGS); \
    fi


start-localstack-pro:
	cd devops-tooling && docker compose -p $(APP_NAME)-pro -f docker-compose-pro.yml up

start-localstack-splunk:
	cd devops-tooling && docker compose -p $(APP_NAME)-splunk -f docker-compose-splunk.yml up

stop-localstack:
	cd devops-tooling && docker compose down $(DOCKER_COMPOSE_FLAGS)

iac-shared:
	pushd iac/iac-shared && npm install && npm run build && popd

build:
	cd src/lambda-hello-name && rm -f lambda.zip
	cd src/lambda-hello-name && npm install
	cd src/lambda-hello-name && npm run build
	cd src/lambda-hello-name && npm prune --omit=dev
	mkdir -p src/lambda-hello-name/bundle
	cp -r src/lambda-hello-name/dist/* src/lambda-hello-name/bundle
	cp -r src/lambda-hello-name/node_modules src/lambda-hello-name/bundle
	cd src/lambda-hello-name/bundle &&  zip -r ../lambda.zip *
	cd src/common_layer && make

# Hot reloading watching to run build
watch-lambda:
	cd src/lambda-hello-name && npm install && npm run watch

# Run the tests
test: venv
	$(VENV_RUN) && cd auto_tests && AWS_PROFILE=localstack pytest $(ARGS);


##################################################
# Targets that can be run from the CI/CD pipeline.

run-ci-test:
	# override IS_LOCAL so we don't do hot reloading in CI
	# If MAPPING_DIR_NAME isn't set, print error message and exit with error
	if [ "$(OVERRIDE_LOCAL_ARCH)" != "$(ARCHITECTURE)" ]; then \
		ARCHITECTURE=$(OVERRIDE_LOCAL_ARCH); \
		echo "Override local architecture with $(OVERRIDE_LOCAL_ARCH)"; \
	fi; \
	echo "Running CI test for architecture $$ARCHITECTURE"; \
	if [ "$(ARCHITECTURE)" == "x86_64" ]; then \
		cd devops-tooling && \
		docker compose -f docker-compose.localstack.yml \
					   -f docker-compose.ci_test.yml \
					   -f docker-compose.amd64_localstack.yml \
					   -f docker-compose.amd64_test.yml \
					   -p $(APP_NAME) up $(DOCKER_COMPOSE_FLAGS); \
	else \
		cd devops-tooling && \
		docker compose -f docker-compose.localstack.yml \
					   -f docker-compose.ci_test.yml \
					   -p $(APP_NAME) up $(DOCKER_COMPOSE_FLAGS); \
	fi

run-all-ci-tests:
	CI_TEST_NAME=awscdk make run-ci-test;
	CI_TEST_NAME=awscdktf make run-ci-test;
