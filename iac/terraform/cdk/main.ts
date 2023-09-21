import {App} from "cdktf"
import * as path from 'path'
import {VpcStack} from "./vpc"
import {AppStack} from "./appStack"

(async () => {
    const app = new App()
    const sbxVpc = new VpcStack(app, "LsMultiEnvVpc.sbx", {
        isLocal: false,
        vpcConfigPath: path.resolve("../../../devops-tooling/accounts/my-sb.json"),
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
        vpc: sbxVpc.vpcOutput
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
        vpc: localVpcStack.vpcOutput
    })
    app.synth()
})().catch(e => {
    // Deal with the fact the chain failed
    console.error(e)
})

