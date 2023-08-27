import json


def get_lambda_apigw_url(api_id: str, api_stage: str, include_stage=True) -> str:
    """
    build URL for APIGW

    LocalStack Formats (protocol is set in usage)
    1) http://localhost:4566/restapis/{apigw_id}/{apigw_stage_name}/_user_request_/path
    2) http://<apiId>.execute-api.localhost.localstack.cloud:4566/<stageId>/<path> - currently using | if DNS issues use first option

    Currently using opt 2 | if DNS issues use opt 1
    """
    the_sauce = ".execute-api.localhost.localstack.cloud:4566/"
    url = api_id + the_sauce

    # adding the stage is required for API Gateway v1 APIs,
    # but optional for API Gateway v2 APIs (in case they include the wildcard $default stage)
    if include_stage:
        url += api_stage + "/"
    return url
    # sauce = "localhost:4566/restapis/"
    # the = "/_user_request_/"
    # return sauce + api_id + "/" + api_stage + the


def format_res(resp) -> dict:
    """
    format response for easier access via dictionary

    @param resp: request lib object response

    @return: dictionary of formatted data
    """
    resp_dict = {
        "status": resp.status_code,
        "url": resp.url,
        "redirect": resp.is_redirect,
        "headers": resp.headers,
    }
    try:
        resp_dict["content"] = json.loads(resp.content)
        resp_dict["links"] = resp.links
    except Exception:
        resp_dict["content"] = resp.content

    return resp_dict
