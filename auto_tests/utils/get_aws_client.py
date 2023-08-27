import os

import boto3

from lib import get_logger

logger = get_logger.logger()


def get_session():
    return boto3.session.Session()


def get_endpoint_url():
    ls_endpoint = os.getenv("LOCALSTACK_ENDPOINT", "http://localstack:4566")
    logger.debug(
        f"get_endpoint: endpoint url: {ls_endpoint} (from LOCALSTACK_ENDPOINT)"
    )
    return ls_endpoint


def client(clientType):
    session = get_session()
    region = os.getenv("AWS_REGION", "us-east-1")
    aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID", "test")
    aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY", "test")

    if not session:
        return boto3.client(clientType, verify=False)

    return session.client(
        clientType,
        verify=False,
        endpoint_url=get_endpoint_url(),
        region_name=region,
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
    )


def resource(clientType):
    session = get_session()
    region = os.getenv("AWS_REGION", "us-east-1")
    aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID", "test")
    aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY", "test")

    if not session:
        return boto3.resource(clientType, verify=False)

    return session.resource(
        clientType,
        verify=False,
        endpoint_url=get_endpoint_url(),
        region_name=region,
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
    )
