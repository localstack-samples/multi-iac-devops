import * as cdk from 'aws-cdk-lib'
import {aws_s3 as s3, Duration, RemovalPolicy} from 'aws-cdk-lib'
import {Architecture, AssetCode, Code, Function, Runtime} from "aws-cdk-lib/aws-lambda"
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import {Construct} from 'constructs'
import * as Iam from "aws-cdk-lib/aws-iam"
import {PolicyStatement} from "aws-cdk-lib/aws-iam"
import * as S3 from "aws-cdk-lib/aws-s3"
// API Gateway V2 HTTP API - ALPHA
// API Gateway V2 HTTP API
import {HttpLambdaIntegration} from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2"
import {HttpApi, HttpStage} from "aws-cdk-lib/aws-apigatewayv2"
import * as ApiGateway from "aws-cdk-lib/aws-apigateway"
import {AuthorizationType} from "aws-cdk-lib/aws-apigateway"

export interface LsMultiEnvAppProps extends cdk.StackProps {
    isLocal: boolean;
    environment: string;
    handler: string;
    runtime: Runtime;
    lambdaDistPath: string;
    listBucketName: string;
    stageName: string;
    version: string;
    region: string;
}

// AWS CDK App Stack
// Create an S3 bucket, Lambda, HttpAPI with Lambda binding
export class AwscdkStack extends cdk.Stack {
    private httpApi: HttpApi
    private lambdaFunction: Function
    private bucket: s3.Bucket
    private lambdaCode: Code

    constructor(scope: Construct, id: string, props: LsMultiEnvAppProps) {
        super(scope, id, props)

        const architecture = process.env.ARCHITECTURE
        const overridingLocalArch = process.env.OVERRIDE_LOCAL_ARCH

        let targetArchitecture = undefined
        if (architecture != overridingLocalArch) {
            if (overridingLocalArch == "x86_64" || overridingLocalArch == "amd64") {
                targetArchitecture = Architecture.X86_64
            } else {
                targetArchitecture = Architecture.ARM_64
            }
        }
        // props.isLocal is true when stacks are deployed using localstack
        if (!props.isLocal) {
            targetArchitecture = Architecture.ARM_64
        }

        // Lambda Source Code
        // If running on LocalStack, setup Hot Reloading with a fake bucked named hot-reload
        if (props.isLocal) {
            const lambdaBucket = s3.Bucket.fromBucketName(this, "HotReloadingBucket", "hot-reload")
            this.lambdaCode = Code.fromBucket(lambdaBucket, props.lambdaDistPath)
        } else {
            this.lambdaCode = new AssetCode(`../../src/lambda-hello-name/dist`)
        }
        // create a table
        const ddbTable = new dynamodb.Table(this, `mytable-${props.environment}`, {
            tableName: `mytable-${props.environment}`,
            partitionKey: {
                name: 'id',
                type: dynamodb.AttributeType.STRING,
            },
        })


        // Create a bucket for something future purpose
        this.bucket = new s3.Bucket(this, 'lambdawork', {
            enforceSSL: false,
            removalPolicy: RemovalPolicy.DESTROY,
        })

        // HTTP API Gateway V2
        this.httpApi = new HttpApi(this, this.stackName + "HttpApi", {
            description: "AWS CDKv2 HttpAPI-alpha"
        })

        // Allow Lambda to list bucket contents
        const lambdaPolicy = new PolicyStatement()
        lambdaPolicy.addActions("s3:ListBucket")
        lambdaPolicy.addResources(this.bucket.bucketArn)

        // Create the Lambda
        this.lambdaFunction = new Function(this, 'name-lambda', {
            functionName: 'name-lambda',
            architecture: targetArchitecture,
            handler: props.handler,
            runtime: props.runtime,
            code: this.lambdaCode,
            memorySize: 512,
            timeout: Duration.seconds(10),
            environment: {
                BUCKET: this.bucket.bucketName,
                DDB_TABLE_NAME: ddbTable.tableName,
            },
            initialPolicy: [lambdaPolicy],
        })
        // Allow Lambda to write to this DDB table
        ddbTable.grantWriteData(this.lambdaFunction)

        // HttpAPI Lambda Integration for the above Lambda
        const nameIntegration =
            new HttpLambdaIntegration('NameIntegration', this.lambdaFunction)

        // HttpAPI Route
        // Method:      GET
        // Path:        /
        // Integration: Lambda
        this.httpApi.addRoutes({
            path: '/',
            methods: [apigwv2.HttpMethod.GET],
            integration: nameIntegration,
        })

        // Output the HttpApiEndpoint
        new cdk.CfnOutput(this, 'HttpApiEndpoint', {
            value: this.httpApi.url || '',
            exportName: 'HttpApiEndpoint',
        })
        // Create REST API with Proxy to S3
        const apiGateway = this.createAPIGateway()
        const executeRole = this.createExecutionRole(this.bucket)
        this.bucket.grantReadWrite(executeRole)
        const s3ListBucketIntegration = this.createS3ListBucketIntegration(this.bucket, executeRole)
        const s3ListIntegration = this.createS3ListIntegration(this.bucket, executeRole)
        const s3BucketIntegration = this.createS3BucketIntegration(this.bucket, executeRole)
        const s3Integration = this.createS3Integration(this.bucket, executeRole)
        this.addAssetsEndpoint(apiGateway, s3BucketIntegration, s3Integration, s3ListIntegration, s3ListBucketIntegration)
        // Output the RestApiUrl
        new cdk.CfnOutput(this, 'RestApiEndpoint', {
            value: apiGateway.url,
            exportName: 'RestApiEndpoint',
        })
        // Output the DDB Table Name
        new cdk.CfnOutput(this, 'ddbTableName', {
            value: ddbTable.tableName,
            exportName: 'ddbTableName',
        })

    }

    private createAPIGateway() {
        return new ApiGateway.RestApi(this, "assets-api", {
            restApiName: "Static assets provider",
            description: "Serves assets from the S3 bucket.",
            binaryMediaTypes: ["*/*"],
        })
    }

    private createExecutionRole(bucket: S3.IBucket) {
        const executeRole = new Iam.Role(this, "api-gateway-s3-assume-tole", {
            assumedBy: new Iam.ServicePrincipal("apigateway.amazonaws.com"),
            roleName: "API-Gateway-S3-Integration-Role",
        })

        executeRole.addToPolicy(
            new Iam.PolicyStatement({
                resources: ["*"],
                actions: ["s3:Get*",
                    "s3:List*"],
            })
        )

        return executeRole
    }


    private createS3ListIntegration(assetsBucket: S3.IBucket, executeRole: Iam.Role) {
        return new ApiGateway.AwsIntegration({
            service: "s3",
            integrationHttpMethod: "GET",
            path: `/`,
            options: {
                credentialsRole: executeRole,
                passthroughBehavior: ApiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
                integrationResponses: [
                    {
                        statusCode: "200",
                        responseParameters: {
                            "method.response.header.Content-Type": "integration.response.header.Content-Type",
                        },
                    },
                ],
            }
        })
    }

    private createS3BucketIntegration(assetsBucket: S3.IBucket, executeRole: Iam.Role) {
        return new ApiGateway.AwsIntegration({
            service: "s3",
            integrationHttpMethod: "GET",
            path: `${assetsBucket.bucketName}/{folder}/{key}`,
            options: {
                credentialsRole: executeRole,
                passthroughBehavior: ApiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
                integrationResponses: [
                    {
                        statusCode: "200",
                        responseParameters: {
                            "method.response.header.Content-Type": "integration.response.header.Content-Type",
                        },
                    },
                ],

                requestParameters: {
                    "integration.request.path.folder": "method.request.path.folder",
                    "integration.request.path.key": "method.request.path.key",
                },
            },
        })
    }

    private createS3Integration(assetsBucket: S3.IBucket, executeRole: Iam.Role) {
        return new ApiGateway.AwsIntegration({
            service: "s3",
            integrationHttpMethod: "GET",
            path: '{bucket}/{object}',
            options: {
                credentialsRole: executeRole,
                passthroughBehavior: ApiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
                requestParameters: {
                    'integration.request.path.bucket': 'method.request.path.folder',
                    'integration.request.path.object': 'method.request.path.item',
                },
                integrationResponses: [
                    {
                        statusCode: "200",
                        responseParameters: {
                            "method.response.header.Content-Type": "integration.response.header.Content-Type",
                        },
                    },
                ],
            },
        })
    }

    private createS3ListBucketIntegration(assetsBucket: S3.IBucket, executeRole: Iam.Role) {
        return new ApiGateway.AwsIntegration({
            service: "s3",
            // region: "us-east-1",
            path: '{bucket}',
            integrationHttpMethod: "GET",
            options: {
                credentialsRole: executeRole,
                passthroughBehavior: ApiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
                requestParameters: {'integration.request.path.bucket': 'method.request.path.folder'},
                integrationResponses: [{
                    statusCode: '200',
                    responseParameters: {'method.response.header.Content-Type': 'integration.response.header.Content-Type'}
                }]
            }
        })
    }

    private addAssetsEndpoint(
        apiGateway: ApiGateway.RestApi,
        s3BucketIntegration: ApiGateway.AwsIntegration,
        s3Integration: ApiGateway.AwsIntegration,
        s3ListIntegration: ApiGateway.AwsIntegration,
        listBucketIntegration: ApiGateway.AwsIntegration
    ) {
        apiGateway.root
            .addResource("assets")
            .addResource("{folder}")
            .addResource("{key}")
            .addMethod("GET", s3BucketIntegration, {
                authorizationType: AuthorizationType.NONE,
                methodResponses: [
                    {
                        statusCode: "200",
                        responseParameters: {
                            "method.response.header.Content-Type": true,
                        },
                    },
                ],
                requestParameters: {
                    "method.request.path.folder": true,
                    "method.request.path.key": true,
                    "method.request.header.Content-Type": true,
                },
            })
    }

}

