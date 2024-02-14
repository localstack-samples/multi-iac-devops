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

# Install puppeteer dependencies
apt-get install -y \
ca-certificates \
fonts-liberation \
libasound2 \
libatk-bridge2.0-0 \
libatk1.0-0 \
libc6 \
libcairo2 \
libcups2 \
libdbus-1-3 \
libexpat1 \
libfontconfig1 \
libgbm1 \
libgcc1 \
libglib2.0-0 \
libgtk-3-0 \
libnspr4 \
libnss3 \
libpango-1.0-0 \
libpangocairo-1.0-0 \
libstdc++6 \
libx11-6 \
libx11-xcb1 \
libxcb1 \
libxcomposite1 \
libxcursor1 \
libxdamage1 \
libxext6 \
libxfixes3 \
libxi6 \
libxrandr2 \
libxrender1 \
libxss1 \
libxtst6 \
lsb-release \
wget \
xdg-utils


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
