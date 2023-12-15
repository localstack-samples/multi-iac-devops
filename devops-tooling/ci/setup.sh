#!/bin/bash

# Update system packages
apt-get update && apt-get install -y \
  curl \
  unzip \
  software-properties-common \
  build-essential \
  libbz2-dev \
  libssl-dev \
  libreadline-dev \
  libffi-dev \
  zlib1g-dev \
  libsqlite3-dev \
  liblzma-dev

# Setup AWS CLI
curl "https://d1vvhvl2y92vvt.cloudfront.net/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Setup Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | apt-key add -
apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
apt-get update && apt-get install terraform

# Setup NVM and Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Setup Pyenv and Python
curl https://pyenv.run | bash
source ~/.bashrc
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
