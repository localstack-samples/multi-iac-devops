FROM ubuntu:latest

ENV BASH_ENV=~/.profile

COPY devops-tooling/ci/setup.sh /tmp/setup.sh
RUN chmod +x /tmp/setup.sh && /tmp/setup.sh

COPY devops-tooling/ci/awscdk.sh /usr/local/bin/awscdk
RUN chmod +x /usr/local/bin/awscdk

COPY devops-tooling/ci/cdktf.sh /usr/local/bin/cdktf
RUN chmod +x /usr/local/bin/cdktf

COPY devops-tooling/ci/bootstrap.sh /usr/local/bin/bootstrap
RUN chmod +x /usr/local/bin/bootstrap

COPY devops-tooling/requirements.txt /tmp/requirements.txt

ENTRYPOINT ["/bin/bash"]
CMD ["bootstrap"]
