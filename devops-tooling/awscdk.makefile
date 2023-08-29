awscdkbootstrap: iac-shared
	cd $(STACK_DIR) && $(CDK_CMD) bootstrap --profile localstack
awscdkdeploy: iac-shared
	cd $(STACK_DIR) && $(CDK_CMD) deploy $(TFSTACK_NAME)
awscdkdestroy: iac-shared
	cd $(STACK_DIR) && $(CDK_CMD) destroy $(TFSTACK_NAME)
#awscdkinstall:
#	cd $(STACK_DIR) && npm install
#	cd $(STACK_DIR) && $(CDK_CMD) get
awscdkoutput:
	cd $(STACK_DIR) && $(CDK_CMD) output $(TFSTACK_NAME) $(ARGS)


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

test-awscdk:
	make local-awscdk-output ARGS="--outputs-file ../../../auto_tests/awscdk-output.json"
	cd auto_tests && jq '."LsLambdaS3Sample.local"' awscdk-output.json > iac-output.json;
	make test-awscdk-bare

test-awscdk-bare:
	$(VENV_RUN) && cd auto_tests && AWS_PROFILE=localstack pytest $(ARGS);


local-clean-awscdk:
	- echo "no implemented yet"


# AWS Sandbox target groups
# VPC
sbx-awscdk-vpc-deploy: build awscdkdeploy
sbx-awscdk-vpc-destroy: awscdkdestroy
# Lambda - APIGW - S3
sbx-awscdk-deploy: build awscdkdeploy
sbx-awscdk-destroy: awscdkdestroy
sbx-awscdk-output: awscdkoutput

sbx-awscdk-invoke:
	make sbx-awscdk-output ARGS="--outputs-file ../../../awscdk-output.json" && \
	APIGW=$$(jq -r '."LsLambdaS3Sample.sbx".apigwUrl' awscdk-output.json) && \
	curl "$${APIGW}";
	@rm -f awscdk-output.json
