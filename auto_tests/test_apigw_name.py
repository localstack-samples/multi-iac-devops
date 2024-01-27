import pytest
import requests
import simplejson as json

from utils import DotDict_utils
from utils.fixtures import iac_output
from utils import get_logger
from utils import common_test_utils as ctu
from utils import get_aws_client as get_client

logger = get_logger.logger()


@pytest.mark.integration
class TestNameApigw:
    @staticmethod
    def get_env_vars(iac_output):
        return DotDict_utils.DotDict(
            {
                "REST_API_ENDPOINT": iac_output["apigwUrl"],
                "DDB_TABLE_NAME": iac_output["ddbTableName"],
            }
        )

    @pytest.fixture(autouse=True)
    def run_around_tests(self, iac_output):
        """
        This runaround fixture runs everything before the yield before each test,
        then yields for the test,
        then runs everything after the yield.
        """
        # Get all the ENV vars
        self.env = TestNameApigw.get_env_vars(iac_output)

        # Wait for test to run now
        yield
        # Run after test is done
        # Clear all the user table entries
        dynamoDb = get_client.resource("dynamodb")
        table = dynamoDb.Table(self.env.DDB_TABLE_NAME)
        ctu.clearDdbItems(table)

    def test_lambda_ddb_integration(self, iac_output):
        env = TestNameApigw.get_env_vars(iac_output)
        base_url = env.REST_API_ENDPOINT.replace("https", "http")
        url = f"{base_url}?name=localstack"
        logger.info(f"url: {json.dumps(url)}")
        response = requests.get(
            url)
        print("#######################")
        logger.info(f"response: {response.text}")
        assert response.status_code == 200
        result = json.loads(response.text)
        assert 'body' in result
        body = result['body']
        assert 'name' in body
        name_obj = body['name']
        assert 'submittedName' in name_obj
        submitted_name = name_obj['submittedName']
        assert submitted_name == "localstack"
        assert 'id' in body
        item_id = body['id']
        # Use APIGW requestId to assert appconfig was stored in DDB
        dynamoDb = get_client.resource("dynamodb")
        table = dynamoDb.Table(self.env.DDB_TABLE_NAME)
        response = table.get_item(
            Key={
                'id': item_id,
            }
        )
        item = response['Item']
        # Assert dictionary in APIGW response and DDB are the same
        assert body == item
