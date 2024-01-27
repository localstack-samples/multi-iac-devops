import {APIGatewayProxyEventV2, APIGatewayProxyResultV2} from "aws-lambda"
import {DynamoDBClient} from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient,
    PutCommand,
} from "@aws-sdk/lib-dynamodb"

// Bare-bones DynamoDB Client
const client = new DynamoDBClient({})
// Bare-bones document client
const dynamo = DynamoDBDocumentClient.from(client) // client is DynamoDB client

const {DDB_TABLE_NAME: TABLE_NAME} = process.env

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    const queries = event.queryStringParameters
    let name = 'there'

    if (queries !== null && queries !== undefined) {
        if (queries["name"]) {
            name = queries["name"]
        }
    }
    const item = {
        id: event.requestContext.requestId,
        name: {
            submittedName: name,
        },
    }
    await dynamo.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
        })
    )

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({body: item}),
    }
}
