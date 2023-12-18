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

# Setup AWS CLI
curl "https://d1vvhvl2y92vvt.cloudfront.net/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Setup Terraform
arch=$(uname -m)
if [ "$arch" = "aarch64" ]; then
    arch="arm64"
fi
curl -fsSL https://apt.releases.hashicorp.com/gpg | apt-key add -
apt-add-repository "deb [arch=$arch] https://apt.releases.hashicorp.com $(lsb_release -cs) main" -y
apt-get update && apt-get install terraform -y

# Setup NVM and Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
echo 'export NVM_DIR=$HOME/.nvm' >> ~/.profile
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. $NVM_DIR/nvm.sh' >> ~/.profile
source ~/.profile
nvm install 18
nvm use 18

# Setup Pyenv and Python
curl https://pyenv.run | bash
echo 'export PYENV_ROOT=$HOME/.pyenv' >> ~/.profile
echo 'export PATH=$PYENV_ROOT/bin:$PATH' >> ~/.profile
source ~/.profile
eval "$(pyenv init --path)"
pyenv install 3.11
pyenv global 3.11

# Create Python virtual environment and install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r devops-tooling/requirements.txt

# Install Terraform CDK
npm install --global cdktf-cli@^0.18.0 aws-cdk-local aws-cdk

# Setup AWS credentials
make setup-aws
