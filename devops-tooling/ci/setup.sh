#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Update system packages
apt-get update && apt-get install -y \
  curl \
  unzip \
  lsb-release \
  software-properties-common \
  git \
  build-essential \
  libbz2-dev \
  libssl-dev \
  libreadline-dev \
  libffi-dev \
  zlib1g-dev \
  libsqlite3-dev \
  liblzma-dev \
  gnupg \
  gnupg1 \
  gnupg2 \
  jq


# Setup NVM and Node.js
. /usr/local/nvm/nvm.sh use 20

# Setup Pyenv and Python
curl https://pyenv.run | bash
echo 'export PYENV_ROOT=$HOME/.pyenv' >> ~/.profile
echo 'export PATH=$PYENV_ROOT/bin:$PATH' >> ~/.profile
source ~/.profile
eval "$(pyenv init --path)"
pyenv install 3.11 -vvv
pyenv global 3.11

# Install Terraform CDK
npm install --global cdktf-cli@^0.18.0 aws-cdk-local aws-cdk
