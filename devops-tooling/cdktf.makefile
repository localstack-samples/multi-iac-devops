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
local-cdktf-deploy: build cdktfdeploy
local-cdktf-destroy: cdktfdestroy
local-cdktf-output: cdktfoutput
local-cdktf-invoke:
	@make local-cdktf-output ARGS="--outputs-file ../../../local-cdktf-output.json" && \
	APIGW=$$(jq -r '."$(TFSTACK_NAME)".apigwUrl' local-cdktf-output.json) && \
	curl "http://$${APIGW}";
	@rm -f local-cdktf-output.json


local-cdktf-test:
	make local-cdktf-output ARGS="--outputs-file ../../../auto_tests/cdktf-output.json"
	cd auto_tests && jq '."$(TFSTACK_NAME)"' cdktf-output.json > iac-output.json;
	make test

local-cdktf-clean:
	- rm -rf iac/terraform/cdk/terraform.Ls*
	- rm -rf iac/terraform/cdk/cdktf.out


# AWS Sandbox target groups
# VPC
sbx-cdktf-vpc-deploy: build cdktfdeploy
sbx-cdktf-vpc-destroy: cdktfdestroy
# Lambda - APIGW - S3
sbx-cdktf-deploy: build cdktfdeploy
sbx-cdktf-destroy: cdktfdestroy
sbx-cdktf-output: cdktfoutput

# Private Jumphost
sbx-cdktf-jump-deploy: build cdktfdeploy
sbx-cdktf-jump-destroy: cdktfdestroy
sbx-cdktf-jump-output: cdktfoutput

sbx-cdktf-invoke:
	make sbx-cdktf-output ARGS="--outputs-file ../../../cdktf-output.json" && \
	APIGW=$$(jq -r '."$(TFSTACK_NAME)".apigwUrl' cdktf-output.json) && \
	curl "$${APIGW}";
	@rm -f cdktf-output.json
