awscdkinstall:
	cd $(STACK_DIR) && npm install
#	cd $(STACK_DIR) && $(CDK_CMD) get
awscdkbootstrap: iac-shared awscdkinstall build
	cd $(STACK_DIR) && $(CDK_CMD) bootstrap
awscdkdeploy: iac-shared
	cd $(STACK_DIR) && $(CDK_CMD) deploy $(TFSTACK_NAME) --require-approval=never  --outputs-file stack-outputs-$(STACK_SUFFIX).json
awscdkdestroy: iac-shared
	cd $(STACK_DIR) && $(CDK_CMD) destroy $(TFSTACK_NAME) --require-approval=never
awscdkoutput:
	jq '{ apigwUrl: ."LsMultiEnvApp-$(STACK_SUFFIX)".HttpApiEndpoint, ddbTableName: ."LsMultiEnvApp-$(STACK_SUFFIX)".ddbTableName }' \
	iac/awscdk/stack-outputs-$(STACK_SUFFIX).json


# LocalStack target groups
#local-awscdk-install: awscdkinstall
# VPC
local-awscdk-vpc-deploy: build awscdkdeploy
local-awscdk-vpc-destroy: awscdkdestroy
# Lambda - APIGW - S3
local-awscdk-bootstrap: awscdkbootstrap
local-awscdk-deploy: build awscdkdeploy
local-awscdk-destroy: awscdkdestroy
local-awscdk-output: awscdkoutput

local-awscdk-test:
	@$(MAKE)  --silent local-awscdk-output > auto_tests/iac-output.json;
	make test

local-awscdk-invoke:
	@APIGW=$$($(MAKE) --silent local-awscdk-output | jq -r '.apigwUrl') && \
	curl "http://$${APIGW}";

local-awscdk-invoke-loop:
	@APIGW=$$($(MAKE) --silent local-awscdk-output | jq -r '.apigwUrl') && \
	sh run-lambdas.sh "http://$${APIGW}"

local-awscdk-clean:
	- rm -rf iac/awscdk/cdk.out

# AWS Sandbox target groups
# VPC
sbx-awscdk-vpc-deploy: build awscdkdeploy
sbx-awscdk-vpc-destroy: awscdkdestroy
# Lambda - APIGW - S3
sbx-awscdk-bootstrap: awscdkbootstrap
sbx-awscdk-deploy: build awscdkdeploy
sbx-awscdk-destroy: awscdkdestroy
sbx-awscdk-output: awscdkoutput

sbx-awscdk-invoke:
	@APIGW=$$(aws cloudformation describe-stacks \
  --stack-name LsMultiEnvApp-sbx \
  --query "Stacks[0].Outputs[?ExportName=='HttpApiEndpoint'].OutputValue" \
  --output text) && \
	curl "$${APIGW}";
	@rm -f awscdk-output.json
