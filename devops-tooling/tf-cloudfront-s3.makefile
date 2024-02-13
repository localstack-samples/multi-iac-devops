# Define the target specific environment variables needed
# for the local-tf-cfs3 targets.
#
local-tf-cfs3%: export IAC_DIR=iac/terraform/hcl/react-ui
local-tf-cfs3%: export APP_NAME=react-ui
local-tf-cfs3%: export CF_BUCKET_NAME=cfbucket

# Build the react app
local-tf-cfs3-build:
	cd ui/react-app && npm install && npm run build

# Initialize the terraform stack
local-tf-cfs3-init: tf-stack-init
	echo 'bucket_name="$(CF_BUCKET_NAME)"' >> $(IAC_DIR)/$(STACK_SUFFIX).auto.tfvars

# Plan the terraform stack
local-tf-cfs3-plan: tf-stack-plan

# Apply the terraform stack
local-tf-cfs3-apply: local-tf-cfs3-build tf-stack-apply

local-tf-cfs3-output:
	make tf-stack-output > $(IAC_DIR)/terraform_output.json
