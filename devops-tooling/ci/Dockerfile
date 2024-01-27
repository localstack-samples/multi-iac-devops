FROM ubuntu:latest

ENV BASH_ENV=~/.profile

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
