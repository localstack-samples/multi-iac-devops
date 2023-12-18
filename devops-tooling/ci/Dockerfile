FROM ubuntu:latest

ARG ENDPOINT_HOST
ENV ENDPOINT_HOST=$ENDPOINT_HOST

COPY . /multi-iac-devops
WORKDIR /multi-iac-devops

COPY devops-tooling/ci/setup.sh /tmp/setup.sh
RUN chmod +x /tmp/setup.sh && /tmp/setup.sh

COPY devops-tooling/ci/awscdk.sh /usr/local/bin/awscdk.sh
RUN chmod +x /usr/local/bin/awscdk.sh

COPY devops-tooling/ci/cdktf.sh /usr/local/bin/cdktf.sh
RUN chmod +x /usr/local/bin/cdktf.sh

ENTRYPOINT ["/bin/bash"]
