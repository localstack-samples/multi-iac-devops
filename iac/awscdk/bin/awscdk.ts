#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import {Function, Runtime, AssetCode, Code} from "aws-cdk-lib/aws-lambda"
import {AwscdkStack} from '../lib/awscdk-stack'
import path from "path"


const app = new cdk.App()

// AWS CDK App Stack on LocalStack
new AwscdkStack(app, 'LsMultiEnvApp-local', {
    // set isLocal to fasle for integration testing to turn hot-reloading off
    isLocal: true,
    hotDeploy: process.env.IS_INTEGRATION ? false : true,
    environment: 'local',
    lambdaDistPath: process.env.HOST_PROJECT_PATH + "/src/lambda-hello-name/dist",
    handler: "index.handler",
    runtime: Runtime.NODEJS_18_X,
    listBucketName: process.env.LIST_BUCKET_NAME || 'lambda-work',
    stageName: "hello-name",
    version: '0.0.1',
    region: 'us-east-1'
})

// AWS CDK App Stack on AWS
new AwscdkStack(app, 'LsMultiEnvApp-sbx', {
    /* If you don't specify 'env', this stack will be environment-agnostic.
     * Account/Region-dependent features and context lookups will not work,
     * but a single synthesized template can be deployed anywhere. */

    /* Uncomment the next line to specialize this stack for the AWS Account
     * and Region that are implied by the current CLI configuration. */
    // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

    /* Uncomment the next line if you know exactly what Account and Region you
     * want to deploy the stack to. */
    // env: { account: '123456789012', region: 'us-east-1' },

    /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
    isLocal: false,
    hotDeploy: false,
    environment: 'sbx',
    lambdaDistPath: process.env.HOST_PROJECT_PATH + "/src/lambda-hello-name/dist",
    handler: "index.handler",
    runtime: Runtime.NODEJS_18_X,
    listBucketName: process.env.LIST_BUCKET_NAME || 'lambda-work',
    stageName: "hello-name",
    version: '0.0.1',
    region: 'us-east-1'
})