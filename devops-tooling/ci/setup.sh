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
#arch=$(ARCH)
#curl "https://d1vvhvl2y92vvt.cloudfront.net/awscli-exe-linux-$arch.zip" -o "awscliv2.zip"
#unzip awscliv2.zip
#./aws/install
ARCH=`uname -m`
if [ "$ARCH" = "x86_64" ]; then
   echo "aws x86_64"
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64-${AWS_VERSION}.zip" -o "awscliv2.zip"
   curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb"
   curl -o /usr/local/bin/aws-iam-authenticator https://s3.us-west-2.amazonaws.com/amazon-eks/1.21.2/2021-07-05/bin/linux/amd64/aws-iam-authenticator
else
   ARCH=arm64
   echo "aws assuming ARM"
   curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64-${AWS_VERSION}.zip" -o "awscliv2.zip"
   curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_arm64/session-manager-plugin.deb" -o "session-manager-plugin.deb"
   curl -o /usr/local/bin/aws-iam-authenticator https://s3.us-west-2.amazonaws.com/amazon-eks/1.21.2/2021-07-05/bin/linux/arm64/aws-iam-authenticator
fi
chmod +x /usr/local/bin/aws-iam-authenticator
unzip -q "awscliv2.zip"
./aws/install
rm awscliv2.zip
dpkg -i session-manager-plugin.deb
rm ./session-manager-plugin.deb
apt install -fy --fix-missing --no-install-recommends amazon-ecr-credential-helper


# Setup Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor > /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" > /etc/apt/sources.list.d/hashicorp.list
apt-get update && apt install terraform -y

# Install Docker client
# install docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -fy --fix-missing  docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

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
pyenv install 3.11 -vvv
pyenv global 3.11

# Install Terraform CDK
npm install --global cdktf-cli@^0.18.0 aws-cdk-local aws-cdk
