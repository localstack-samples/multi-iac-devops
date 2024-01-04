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
arch=$(uname -m)
curl "https://d1vvhvl2y92vvt.cloudfront.net/awscli-exe-linux-$arch.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install


# Setup Terraform
if [ "$arch" = "aarch64" ]; then
    arch="arm64"
elif [ "$arch" = "x86_64" ]; then
    arch="amd64"
fi
curl -fsSL https://apt.releases.hashicorp.com/gpg | apt-key add -
apt-add-repository "deb [arch=$arch] https://apt.releases.hashicorp.com $(lsb_release -cs) main" -y
apt-get update && apt-get install terraform -y

# Install Docker client
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=$arch] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" -y
apt-get update
apt-get install -y docker-ce

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
pyenv install 3.10 -vvv
pyenv global 3.10

# Install Terraform CDK
npm install --global cdktf-cli@^0.18.0 aws-cdk-local aws-cdk
