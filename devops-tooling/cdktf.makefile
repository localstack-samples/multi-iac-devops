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
