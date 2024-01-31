import os
import boto3


def get_session():
    return boto3.session.Session()


def client(client_type, region: str = "us-east-1"):
    session = get_session()
    if session:
        return session.client(client_type, region_name=region)
    return boto3.client(client_type, region_name=region)


def resource(client_type: str, region: str = "us-east-1"):
    session = get_session()
    if session:
        return session.resource(client_type, region_name=region)
    return boto3.resource(client_type, region_name=region)
