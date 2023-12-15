FROM ubuntu:latest

ARG ENDPOINT_HOST
ENV ENDPOINT_HOST=$ENDPOINT_HOST

COPY setup.sh /tmp/setup.sh
RUN chmod +x /tmp/setup.sh && /tmp/setup.sh

COPY awscdk.sh /usr/local/bin/awscdk.sh
RUN chmod +x /usr/local/bin/awscdk.sh

COPY cdktf.sh /usr/local/bin/cdktf.sh
RUN chmod +x /usr/local/bin/cdktf.sh

ENTRYPOINT ["/bin/bash"]
