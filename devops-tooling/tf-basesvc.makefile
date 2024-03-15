# Define the target specific environment variables needed
# for the local-tf-vpcbase targets.
#
local-tf-basesvc%: export IAC_DIR=iac/terraform/hcl/basesvc
local-tf-basesvc%: export APP_NAME=basesvc
local-tf-basesvc%: export CF_BUCKET_NAME=cfbucket


# Initialize the terraform stack
local-tf-basesvc-init: tf-stack-init
	echo 'bucket_name="$(CF_BUCKET_NAME)"' >> $(IAC_DIR)/$(STACK_SUFFIX).auto.tfvars

# Plan the terraform stack
local-tf-basesvc-plan: tf-stack-plan

# Apply the terraform stack
local-tf-basesvc-apply: tf-stack-apply

local-tf-basesvc-output:
	@$(MAKE) --silent tf-stack-output > $(IAC_DIR)/terraform_output.json
