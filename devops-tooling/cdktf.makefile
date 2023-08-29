cdktfdeploy: iac-shared
	cd $(STACK_DIR) && cdktf deploy $(TFSTACK_NAME)
cdktfdestroy: iac-shared
	cd $(STACK_DIR) && cdktf destroy $(TFSTACK_NAME)
cdktfinstall:
	cd $(STACK_DIR) && npm install
	cd $(STACK_DIR) && cdktf get
cdktfoutput:
	cd $(STACK_DIR) && cdktf output $(TFSTACK_NAME) $(ARGS)


# LocalStack target groups
local-cdktf-install: cdktfinstall
# VPC
local-cdktf-vpc-deploy: build cdktfdeploy
local-cdktf-vpc-destroy: cdktfdestroy
# Lambda - APIGW - S3
local-cdktf-deploy: build cdktfdeploy
local-cdktf-destroy: cdktfdestroy
local-cdktf-output: cdktfoutput

test-cdktf:
	make local-cdktf-output ARGS="--outputs-file ../../../auto_tests/cdktf-output.json"
	cd auto_tests && jq '."LsLambdaS3Sample.local"' cdktf-output.json > iac-output.json;
	make test-cdktf-bare

test-cdktf-bare:
	$(VENV_RUN) && cd auto_tests && AWS_PROFILE=localstack pytest $(ARGS);


local-clean-cdktf:
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

sbx-cdktf-invoke:
	make sbx-cdktf-output ARGS="--outputs-file ../../../cdktf-output.json" && \
	APIGW=$$(jq -r '."LsLambdaS3Sample.sbx".apigwUrl' cdktf-output.json) && \
	curl "$${APIGW}";
	@rm -f cdktf-output.json
