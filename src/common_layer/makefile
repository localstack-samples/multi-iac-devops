NEW_CKSUM := $(shell md5sum package.json  ../../devops-tooling/docker/Dockerfile.js.layer ../../devops-tooling/docker/makefile.js.layer ./makefile 2>/dev/null| md5sum | cut -f1 -d' ')

-include ../../devops-tooling/docker/makefile.js.layer
