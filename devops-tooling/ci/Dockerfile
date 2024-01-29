FROM ubuntu:latest

ENV BASH_ENV=~/.profile

# update system deps
RUN \
    --mount=type=cache,target=/var/cache/apt \
    apt-get update -y --fix-missing --no-install-recommends && apt-get -y --fix-missing --no-install-recommends upgrade

# install core
RUN apt-get install -fy --fix-missing --no-install-recommends \
    zip unzip jq \
    curl wget

COPY devops-tooling/ci/setup.sh /tmp/setup.sh
RUN chmod +x /tmp/setup.sh && /tmp/setup.sh

# copy awssdk
COPY devops-tooling/ci/awscdk.sh /usr/local/bin/awscdk
RUN chmod +x /usr/local/bin/awscdk

COPY devops-tooling/ci/awscdktf.sh /usr/local/bin/awscdktf
RUN chmod +x /usr/local/bin/awscdktf

# copy bootstrap script
COPY devops-tooling/ci/bootstrap.sh /usr/local/bin/bootstrap
RUN chmod +x /usr/local/bin/bootstrap

COPY devops-tooling/requirements.txt /tmp/requirements.txt

ENTRYPOINT ["/bin/bash"]
CMD ["bootstrap"]
