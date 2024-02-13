FROM ubuntu:latest
ENV DEBIAN_FRONTEND noninteractive

ENV BASH_ENV=~/.profile

# update system
RUN \
    --mount=type=cache,target=/var/cache/apt \
    apt-get update -y --fix-missing --no-install-recommends && apt-get -y --fix-missing --no-install-recommends upgrade

# install core
RUN \
    --mount=type=cache,target=/var/cache/apt \
    apt-get install -fy --fix-missing --no-install-recommends locales apt-transport-https \
    software-properties-common dselect zip unzip xz-utils procps less dos2unix jq groff file bash-completion \
    inetutils-ping net-tools dnsutils ssh curl wget telnet-ssl netcat socat ca-certificates gnupg2 git \
    postgresql-client mysql-client

# install dev
#RUN \
#    --mount=type=cache,target=/var/cache/apt \
#    apt-get install -fy --fix-missing --no-install-recommends build-essential make libffi-dev libreadline-dev libncursesw5-dev libssl-dev \
#    libsqlite3-dev libgdbm-dev libc6-dev libbz2-dev zlib1g-dev llvm libncurses5-dev liblzma-dev libpq-dev libcurl4-openssl-dev

# install docker
RUN install -m 0755 -d /etc/apt/keyrings
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
RUN chmod a+r /etc/apt/keyrings/docker.gpg
RUN echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
RUN apt-get update
RUN apt-get install -fy --fix-missing  docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

ARG AWS_VERSION=2.15.12
RUN  /bin/bash -c 'set -ex && \
    ARCHITECTURE=`uname -m` && \
    echo "AWSCLI ARCHITECTURE: $ARCHITECTURE" && \
    if [ "ARCHITECTURE" = "x86_64" ]; then \
       echo "aws x86_64" && \
       curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64-${AWS_VERSION}.zip" -o "awscliv2.zip" && \
       curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_64bit/session-manager-plugin.deb" -o "session-manager-plugin.deb" && \
       curl -o /usr/local/bin/aws-iam-authenticator https://s3.us-west-2.amazonaws.com/amazon-eks/1.21.2/2021-07-05/bin/linux/amd64/aws-iam-authenticator; \
    else \
       echo "aws assuming ARM" && \
       curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64-${AWS_VERSION}.zip" -o "awscliv2.zip" && \
       curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/ubuntu_arm64/session-manager-plugin.deb" -o "session-manager-plugin.deb" && \
       curl -o /usr/local/bin/aws-iam-authenticator https://s3.us-west-2.amazonaws.com/amazon-eks/1.21.2/2021-07-05/bin/linux/arm64/aws-iam-authenticator; \
    fi; \
    chmod +x /usr/local/bin/aws-iam-authenticator && \
    unzip -q "awscliv2.zip" && ./aws/install && rm awscliv2.zip && \
    dpkg -i session-manager-plugin.deb && rm ./session-manager-plugin.deb; \
    apt install -fy --fix-missing --no-install-recommends amazon-ecr-credential-helper; \
'

# if bitwarden is enabled so will node
ARG NODE_VERSION=20
ENV NVM_DIR /usr/local/nvm
RUN  /bin/bash -c 'if [ -n "${NODE_VERSION}" ]; then \
    mkdir -p "$NVM_DIR" && \
    curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash && \
    . $NVM_DIR/nvm.sh && \
    nvm install "${NODE_VERSION}" && \
    nvm alias default "${NODE_VERSION}" && \
    nvm use default "${NODE_VERSION}" && \
    npm -g i npm@latest yarn npm-check-updates; \
fi'


# cdk is installed as global node cli module
ARG USE_CDK=yes
RUN  /bin/bash -c 'if [ "${USE_CDK}" = "yes" ] ; then \
  wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor > /usr/share/keyrings/hashicorp-archive-keyring.gpg; \
  echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" > /etc/apt/sources.list.d/hashicorp.list; \
  . $NVM_DIR/nvm.sh && \
  npm -g i aws-cdk-local@latest aws-cdk@latest; \
fi'


# terraform is installed
RUN /bin/bash -c 'set -ex; \
    apt-get update && apt-get install -y terraform; \
    . $NVM_DIR/nvm.sh && \
    npm -g i cdktf-cli@latest; '

# install setup script
COPY devops-tooling/ci/setup.sh /tmp/setup.sh
RUN chmod +x /tmp/setup.sh && /tmp/setup.sh

# copy test scripts
COPY devops-tooling/ci/awscdk.sh /usr/local/bin/awscdk
RUN chmod +x /usr/local/bin/awscdk
COPY devops-tooling/ci/awscdktf.sh /usr/local/bin/awscdktf
RUN chmod +x /usr/local/bin/awscdktf
COPY devops-tooling/ci/cloudfront-tf.sh /usr/local/bin/cloudfront-tf
RUN chmod +x /usr/local/bin/cloudfront-tf

# copy bootstrap script
COPY devops-tooling/ci/bootstrap.sh /usr/local/bin/bootstrap
RUN chmod +x /usr/local/bin/bootstrap

COPY devops-tooling/requirements.txt /tmp/requirements.txt

ENTRYPOINT ["/bin/bash"]
CMD ["bootstrap"]
