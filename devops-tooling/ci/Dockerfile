FROM ubuntu:latest

ENV BASH_ENV=~/.profile

# install core
RUN \
    --mount=type=cache,target=/var/cache/apt \
    apt-get install -fy --fix-missing --no-install-recommends locales apt-transport-https \
    zip unzip xz-utils jq \
    curl wget ca-certificates gnupg2

COPY devops-tooling/ci/setup.sh /tmp/setup.sh
RUN chmod +x /tmp/setup.sh && /tmp/setup.sh

COPY devops-tooling/ci/awscdk.sh /usr/local/bin/awscdk
RUN chmod +x /usr/local/bin/awscdk

COPY devops-tooling/ci/awscdktf.sh /usr/local/bin/awscdktf
RUN chmod +x /usr/local/bin/awscdktf

COPY devops-tooling/ci/bootstrap.sh /usr/local/bin/bootstrap
RUN chmod +x /usr/local/bin/bootstrap

COPY devops-tooling/requirements.txt /tmp/requirements.txt

ENTRYPOINT ["/bin/bash"]
CMD ["bootstrap"]
