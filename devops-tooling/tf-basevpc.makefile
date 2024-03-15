# Define the target specific environment variables needed
# for the local-tf-vpcbase targets.
#
local-tf-basevpc%: export IAC_DIR=iac/terraform/hcl/basevpc
local-tf-basevpc%: export APP_NAME=basevpc
local-tf-basevpc%: export CF_BUCKET_NAME=cfbucket


# Initialize the terraform stack
local-tf-basevpc-init: tf-stack-init
	echo 'bucket_name="$(CF_BUCKET_NAME)"' >> $(IAC_DIR)/$(STACK_SUFFIX).auto.tfvars

# Plan the terraform stack
local-tf-basevpc-plan: tf-stack-plan

# Apply the terraform stack
local-tf-basevpc-apply: tf-stack-apply

local-tf-basevpc-output:
	@$(MAKE) --silent tf-stack-output > $(IAC_DIR)/terraform_output.json

#local-tf-basevpc-test:
#	cd auto_tests/jest && npm install && npx jest