import * as cdk from 'aws-cdk-lib'
import {aws_s3 as s3, Duration} from 'aws-cdk-lib'
import {Function, Runtime, AssetCode, Code, S3Code, Architecture} from "aws-cdk-lib/aws-lambda"
import {Construct} from 'constructs'
import {PolicyStatement} from "aws-cdk-lib/aws-iam"
// API Gateway V2 HTTP API - ALPHA
import {HttpLambdaIntegration} from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import {HttpApi} from "@aws-cdk/aws-apigatewayv2-alpha"
import * as apigwv2 from "@aws-cdk/aws-apigatewayv2-alpha"

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

        // Run Lambda on ARM_64 in AWS and locally when local arch is ARM_64.
        let arch = Architecture.ARM_64
        const localArch = process.env.LOCAL_ARCH
        if (props.isLocal && localArch == 'x86_64') {
            arch = Architecture.X86_64
        }
        // Lambda Source Code
        // If running on LocalStack, setup Hot Reloading with a fake bucked named hot-reload
        if (props.isLocal) {
            const lambdaBucket = s3.Bucket.fromBucketName(this, "HotReloadingBucket", "hot-reload")
            this.lambdaCode = Code.fromBucket(lambdaBucket, props.lambdaDistPath)
        } else {
            this.lambdaCode = new AssetCode(`../../src/lambda-hello-name/dist`)
        }

        // Create a bucket for something future purpose
        this.bucket = new s3.Bucket(this, 'lambdawork', {
            enforceSSL: false,
        })

        // API Gateway V2 Http API
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
            architecture: arch,
            handler: props.handler,
            runtime: props.runtime,
            code: this.lambdaCode,
            memorySize: 512,
            timeout: Duration.seconds(10),
            environment: {
                BUCKET: this.bucket.bucketName,
            },
            initialPolicy: [lambdaPolicy],
        })

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
            value: this.httpApi.apiEndpoint
        })
    }

}

