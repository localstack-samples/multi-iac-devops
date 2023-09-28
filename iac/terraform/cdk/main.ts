import {App} from "cdktf"
import * as path from 'path'
import {VpcStack} from "./vpc"
import {AppStack} from "./appStack"
import {JumphostStack} from "./jumphostStack"

const app = new App()
const sbxVpc = new VpcStack(app, "LsMultiEnvVpc.sbx", {
    isLocal: false,
    vpcConfigPath: path.resolve("../../../" + process.env.SBX_ACCOUNT_CONFIG || "devops-tooling/accounts/my-sb.json"),
    region: "us-east-1",
    accountType: "sandbox"
})
new AppStack(app, "LsMultiEnvApp.sbx", {
    isLocal: false,
    environment: 'sbx',
    lambdaDistPath: "../../../src/lambda-hello-name/dist",
    handler: "index.handler",
    runtime: "nodejs18.x",
    listBucketName: process.env.LIST_BUCKET_NAME || 'lambda-work',
    stageName: "hello-name",
    version: '0.0.1',
    region: 'us-east-1',
    vpc: sbxVpc.vpc,
    alblogsBucket: sbxVpc.alblogsBucket
})

new JumphostStack(app, "LsMultiEnvJump.sbx", {
    isLocal: false,
    environment: 'sbx',
    region: 'us-east-1',
    instanceType: 't2.micro',
    vpc: sbxVpc.vpc,
})

const localVpcStack = new VpcStack(app, "LsMultiEnvVpc.local", {
    isLocal: true,
    vpcConfigPath: path.resolve("../../../devops-tooling/accounts/localstack.json"),
    region: "us-east-1",
    accountType: "localstack"
})
new AppStack(app, "LsMultiEnvApp.local", {
    isLocal: true,
    environment: 'local',
    lambdaDistPath: "../../../src/lambda-hello-name/dist",
    handler: "index.handler",
    runtime: "nodejs18.x",
    listBucketName: process.env.LIST_BUCKET_NAME || 'lambda-work',
    stageName: "hello-name",
    version: '0.0.1',
    region: 'us-east-1',
    vpc: localVpcStack.vpc,
    alblogsBucket: localVpcStack.alblogsBucket
})
app.synth()
