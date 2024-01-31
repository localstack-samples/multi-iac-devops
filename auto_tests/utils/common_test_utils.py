import random
import string
from urllib.parse import urlparse, parse_qs
import uuid
from datetime import datetime
from utils.get_logger import logger

log = logger()


def shortHash():
    return str(uuid.uuid4())[:8]


def clearDdbItems(ddb_table):
    log.info(f"Clearing user DDB items: {ddb_table.table_name}")
    """
    NOTE: there are reserved attributes for key names, please see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ReservedWords.html
    if a hash or range key is in the reserved word list, you will need to use the ExpressionAttributeNames parameter
    described at https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/dynamodb.html#DynamoDB.Table.scan
    """

    pkNames = {"#id": "id"}
    counter = 0
    projectionExpression = "#id"

    page = ddb_table.scan(
        ProjectionExpression=projectionExpression, ExpressionAttributeNames=pkNames
    )
    with ddb_table.batch_writer() as batch:
        while page["Count"] > 0:
            counter += page["Count"]
            # Delete items in batches
            for itemKeys in page["Items"]:
                batch.delete_item(Key=itemKeys)
            # Fetch the next page
            if "LastEvaluatedKey" in page:
                page = ddb_table.scan(
                    ProjectionExpression=projectionExpression,
                    ExpressionAttributeNames=pkNames,
                    ExclusiveStartKey=page["LastEvaluatedKey"],
                )
            else:
                break
    log.info(f"Deleted {counter} docs from DDB")
