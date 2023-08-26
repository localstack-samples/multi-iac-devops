cdktfdeploy:
	cd $(STACK_DIR) && cdktf deploy $(TFSTACK_NAME)
cdktfdestroy:
	cd $(STACK_DIR) && cdktf destroy $(TFSTACK_NAME)
cdktfinstall:
	cd $(STACK_DIR) && npm install

# LocalStack targets
local-cdktf-install: cdktfinstall
# Build dotnet project, deploy to LocalStack
local-cdktf-deploy: build cdktfdeploy
local-cdktf-destroy: cdktfdestroy
