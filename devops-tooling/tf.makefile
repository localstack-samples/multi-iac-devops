local-tf-create-iac-bucket:
	$(AWS_CMD) s3api create-bucket --region $(AWS_REGION) --bucket $(IAC_BUCKET)
	$(AWS_CMD) s3api put-bucket-versioning --bucket $(IAC_BUCKET) --versioning-configuration Status=Enabled

make-tf-vars:
	@rm -f $(IAC_DIR)/*.auto.tfvars
	echo 'app_name="$(APP_NAME)"' >> $(IAC_DIR)/$(STACK_ENV).auto.tfvars
	echo 'tfstate_bucket_name="$(IAC_BUCKET)"' >> $(IAC_DIR)/$(STACK_ENV).auto.tfvars
	echo 'aws_profile="$(STACK_AWS_PROFILE)"' >> $(IAC_DIR)/$(STACK_ENV).auto.tfvars
	echo 'aws_region="$(AWS_REGION)"' >> $(IAC_DIR)/$(STACK_ENV).auto.tfvars
	echo 'stack_env="$(STACK_ENV)"' >> $(IAC_DIR)/$(STACK_ENV).auto.tfvars
	echo 'localstack="$(IS_LOCAL)"' >> $(IAC_DIR)/$(STACK_ENV).auto.tfvars
	echo 'logging_level="$(LOGGING_LEVEL)"' >> $(IAC_DIR)/$(STACK_ENV).auto.tfvars


tf-stack-init: make-tf-vars
	$(VENV_RUN) && cd $(IAC_DIR) && $(TFORM_CMD) init -upgrade -reconfigure \
    -backend-config="bucket=$(IAC_BUCKET)" \
    -backend-config="key=$(APP_NAME)/$(STACK_ENV)/terraform.tfstate" \
    -backend-config="region=$(AWS_REGION)"

tf-stack-plan:
	$(VENV_RUN) && cd $(IAC_DIR) && $(TFORM_CMD) plan -var-file="$(STACK_ENV).auto.tfvars" -out=$(STACK_ENV).tfplan

tf-stack-apply:
	$(VENV_RUN) && cd $(IAC_DIR) && $(TFORM_CMD) apply -auto-approve $(STACK_ENV).tfplan

tf-stack-output:
	@$(VENV_RUN) && cd $(IAC_DIR) && $(TFORM_CMD) output -json

tf-stack-destroy:
	$(VENV_RUN) && cd $(IAC_DIR) && $(TFORM_CMD) destroy -auto-approve

