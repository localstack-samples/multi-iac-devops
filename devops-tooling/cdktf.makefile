# Add --ignore-missing-stack-dependencies. Waiting for issue below to be fixed.
# https://github.com/hashicorp/terraform-cdk/issues/2976
cdktfdeploy: iac-shared
	cd $(STACK_DIR) && cdktf deploy $(TFSTACK_NAME) --ignore-missing-stack-dependencies --auto-approve
cdktfdestroy: iac-shared
	cd $(STACK_DIR) && cdktf destroy $(TFSTACK_NAME) --ignore-missing-stack-dependencies --auto-approve
cdktfinstall:
	cd $(STACK_DIR) && npm install
	cd $(STACK_DIR) && cdktf get
cdktfoutput:
	@cd $(STACK_DIR) && cdktf output $(TFSTACK_NAME) $(ARGS)


# LocalStack make target groups
local-cdktf-install: cdktfinstall
# VPC
local-cdktf-vpc-deploy: build cdktfdeploy
local-cdktf-vpc-destroy: cdktfdestroy
# Lambda - APIGW - S3
local-cdktf-destroy: cdktfdestroy
local-cdktf-output: cdktfoutput
local-cdktf-deploy: build cdktfdeploy
	@make -s local-cdktf-output ARGS="--outputs-file ../../../auto_tests/local-cdktf-output.json"


local-cdktf-invoke:
	APIGW="$$(jq -r '."$(TFSTACK_NAME)".apigwUrl' auto_tests/local-cdktf-output.json)" && \
	curl "$${APIGW}";
	@rm -f local-cdktf-output.json


local-cdktf-test:
	cd auto_tests && jq '."$(TFSTACK_NAME)"' local-cdktf-output.json > iac-output.json;
	make -s test

local-cdktf-clean:
	- rm -rf iac/terraform/cdk/terraform.Ls*
	- rm -rf iac/terraform/cdk/cdktf.out


# AWS Sandbox target groups
# VPC
sbx-cdktf-vpc-deploy: build cdktfdeploy
sbx-cdktf-vpc-destroy: cdktfdestroy

sbx-cdktf-destroy: cdktfdestroy
sbx-cdktf-output: cdktfoutput
# Lambda - APIGW - S3
sbx-cdktf-deploy: build cdktfdeploy
		@make -s sbx-cdktf-output ARGS="--outputs-file ../../../auto_tests/local-cdktf-output.json"

# Private Jumphost
sbx-cdktf-jump-deploy: build cdktfdeploy
sbx-cdktf-jump-destroy: cdktfdestroy
sbx-cdktf-jump-output: cdktfoutput

sbx-cdktf-invoke:
	APIGW=$$(jq -r '."$(TFSTACK_NAME)".apigwUrl' ./auto_tests/local-cdktf-output.json) && \
	curl "https://$${APIGW}";
	@rm -f cdktf-output.json
