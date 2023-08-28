import pytest
import requests
import simplejson as json

from utils import DotDict_utils
from utils.fixtures import iac_output
from utils import get_logger

logger = get_logger.logger()


@pytest.mark.integration
class TestNameApigw:
    @staticmethod
    def get_env_vars(iac_output):
        return DotDict_utils.DotDict(
            {
                "REST_API_ENDPOINT": iac_output["apigwUrl"],
            }
        )

    def test_get_hello_name_rest(self, iac_output):
        env = TestNameApigw.get_env_vars(iac_output)
        url = f"http://{env.REST_API_ENDPOINT}?name=Chad"
        logger.info(f"url: {json.dumps(url)}")
        response = requests.get(
            url)
        print("#######################")
        logger.info(f"response: {response.text}")
        assert response.status_code == 200
        result = json.loads(response.text)
        assert result['body'] == "Hello Chad"
