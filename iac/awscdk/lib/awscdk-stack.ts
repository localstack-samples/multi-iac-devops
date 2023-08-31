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

export class AwscdkStack extends cdk.Stack {
    private httpApi: HttpApi
    private lambdaFunction: Function
    private bucket: s3.Bucket
    private lambdaCode: Code

    constructor(scope: Construct, id: string, props: LsMultiEnvAppProps) {
        super(scope, id, props)

        let arch = Architecture.ARM_64
        const localArch = process.env.LOCAL_ARCH
        if (props.isLocal && localArch == 'x86_64') {
            arch = Architecture.X86_64
        }
        // Lambda Source Code
        if (props.isLocal) {
            const lambdaBucket = s3.Bucket.fromBucketName(this, "HotReloadingBucket", "hot-reload")
            this.lambdaCode = Code.fromBucket(lambdaBucket, props.lambdaDistPath)
        } else {
            this.lambdaCode = new AssetCode(`../../src/lambda-hello-name`)
        }

        this.bucket = new s3.Bucket(this, 'lambdawork', {
            enforceSSL: false,
        })

        this.httpApi = new HttpApi(this, this.stackName + "HttpApi", {
            description: "AWS CDKv2 HttpAPI-alpha"
        })

        const lambdaPolicy = new PolicyStatement()
        lambdaPolicy.addActions("s3:ListBucket")
        lambdaPolicy.addResources(this.bucket.bucketArn)

        this.lambdaFunction = new Function(this, 'name-lambda', {
            functionName: 'name-lambda',
            architecture: arch,
            handler: props.handler,
            runtime: props.runtime,
            code: this.lambdaCode,
            // code: new AssetCode(`../../src/lambda-hello-name`),
            memorySize: 512,
            timeout: Duration.seconds(10),
            environment: {
                BUCKET: this.bucket.bucketName,
            },
            initialPolicy: [lambdaPolicy],
        })
        const nameIntegration =
            new HttpLambdaIntegration('NameIntegration', this.lambdaFunction)

        this.httpApi.addRoutes({
            path: '/',
            methods: [apigwv2.HttpMethod.GET],
            integration: nameIntegration,
        })

        new cdk.CfnOutput(this, 'HttpApiEndpoint', {
            value: this.httpApi.apiEndpoint
        })
    }

}

