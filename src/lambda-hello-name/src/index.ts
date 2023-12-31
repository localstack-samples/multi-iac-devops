import {APIGatewayProxyEventV2, APIGatewayProxyResultV2} from "aws-lambda"

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

    return {

        
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({body: `Hello ${name}`}),
    }
}
