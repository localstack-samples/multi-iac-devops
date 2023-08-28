import os

# import jwt
import pytest

# from auto_tests.utils.auth0_mock_utils import get_access_token
from utils.iac_utils import get_iac_output


@pytest.fixture
def iac_output():
    """
    reads pulumi output in a given path

    default path can be overridden by setting env var PULUMI_OUTPUT_PATH

    @return: dict of pulumi output
    """
    path_to_file: str = os.getenv("OUTPUT_PATH", "./iac-output.json")
    return get_iac_output(path_to_file)
