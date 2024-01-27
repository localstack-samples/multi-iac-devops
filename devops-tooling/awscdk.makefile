awscdkinstall:
	cd $(STACK_DIR) && npm install
#	cd $(STACK_DIR) && $(CDK_CMD) get
awscdkbootstrap: iac-shared awscdkinstall build
	cd $(STACK_DIR) && $(CDK_CMD) bootstrap
awscdkdeploy: iac-shared
	cd $(STACK_DIR) && $(CDK_CMD) deploy $(TFSTACK_NAME)
awscdkdestroy: iac-shared
	cd $(STACK_DIR) && $(CDK_CMD) destroy $(TFSTACK_NAME)
awscdkoutput:
	@aws cloudformation describe-stacks \
  --stack-name $(TFSTACK_NAME) \
  --query "Stacks[0].Outputs[?ExportName=='HttpApiEndpoint'].OutputValue" \
  --output text \
  --profile localstack | jq -R -c '{apigwUrl: .}'


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
	make -s local-awscdk-output > auto_tests/iac-output.json;
	make -s test

local-awscdk-invoke:
	@APIGW=$$(make local-awscdk-output | jq -r '.apigwUrl') && \
	curl "http://$${APIGW}";

local-awscdk-invoke-loop:
	@APIGW=$$(make local-awscdk-output | jq -r '.apigwUrl') && \
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
