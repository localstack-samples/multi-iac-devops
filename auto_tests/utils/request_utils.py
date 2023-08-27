import requests


def get_request(
        url: str, params=None, headers=None, allow_redirects=False
) -> requests.models.Response:
    """
    make get request to URL

    @param url: URL to make request to
    @param params: params to make request with
    @param headers: any custom headers
    @param allow_redirects: allow redirect bool

    @return: returns request response object
    """
    if params is None:
        params = {}
    if headers is None:
        headers = {}
    return requests.get(
        url, params=params, allow_redirects=allow_redirects, headers=headers
    )


def post_request(
        url: str,
        data: dict,
        params: dict = None,
        headers: dict = None,
        send_data_as_json: bool = False,
        files: dict = None,
) -> requests.models.Response:
    """
    make a post request to specified URL

    @param data: post data
    @param url: URL to make put request to
    @param data: data to include in POST request
    @param headers: put request headers
    @param params: URL params
    @param send_data_as_json: switch to send data as JSON to backend
    @param files: files to include in POST request

    @return: return request response object
    """
    if params is None:
        params = {}
    if headers is None:
        headers = {}
    if files is None:
        files = {}
    if send_data_as_json:
        return requests.post(
            url, json=data, params=params, headers=headers, files=files
        )
    return requests.post(url, data=data, params=params, headers=headers, files=files)


def put_request(url: str, data: dict, headers=None, params=None):
    """
    make a put request to specified URL

    @param url: URL to make put request to
    @param data: files to include in put request
    @param headers: put request headers
    @param params: URL params

    @return: return request response object
    """
    if params is None:
        params = {}
    if headers is None:
        headers = {}
    return requests.put(url, data=data, headers=headers, params=params)


def delete_request(
        url: str, params=None, headers=None, allow_redirects=False
) -> requests.models.Response:
    """
    make DELETE request to URL

    @param url: URL to make request to
    @param params: params to make request with
    @param headers: any custom headers
    @param allow_redirects: allow redirect bool

    @return: returns request response object
    """
    if params is None:
        params = {}
    if headers is None:
        headers = {}
    return requests.delete(
        url, params=params, headers=headers, allow_redirects=allow_redirects
    )
