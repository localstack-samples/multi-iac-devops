import {Vpc} from "./.gen/modules/vpc"
import {AssetType, S3Backend, TerraformAsset, TerraformOutput, TerraformStack, Token} from "cdktf"
import {Construct} from "constructs"
import path from "path"
import * as random from "@cdktf/provider-random"
import {AwsProvider} from "@cdktf/provider-aws/lib/provider"
import {endpoints} from "./ls-endpoints"
import {S3Bucket} from "@cdktf/provider-aws/lib/s3-bucket"
import * as aws from "@cdktf/provider-aws"
import {Lb} from "@cdktf/provider-aws/lib/lb"
import {DataAwsIamPolicyDocument} from "@cdktf/provider-aws/lib/data-aws-iam-policy-document"
import {S3BucketPolicy} from "@cdktf/provider-aws/lib/s3-bucket-policy"
import {DataAwsElbServiceAccount} from "@cdktf/provider-aws/lib/data-aws-elb-service-account"
import {DataAwsCallerIdentity} from "@cdktf/provider-aws/lib/data-aws-caller-identity"

export interface MyMultiStackConfig {
    isLocal: boolean;
    environment: string;
    handler: string;
    runtime: string;
    lambdaDistPath: string;
    listBucketName: string;
    stageName: string;
    version: string;
    region: string;
    vpc: Vpc;
}

export class AppStack extends TerraformStack {
    private config: MyMultiStackConfig

    constructor(scope: Construct, id: string, config: MyMultiStackConfig) {
        super(scope, id)
        this.config = config
        console.log('config', config)

        let arch = 'arm64'
        const localArch = process.env.LOCAL_ARCH

        if (config.isLocal && localArch == 'x86_64') {
            arch = 'x86_64'
        }
        const lambdaDeployDir: string = path.resolve('../../../app')
        // const dockerAppHash: string = await hashFolder(dockerAppDir);
        console.log(lambdaDeployDir)


        // Create NullProvider to run CMD Line
        // new Null.provider.NullProvider(this, 'Null');
        new random.provider.RandomProvider(this, "random")
        // Create random value
        const randomId = new random.stringResource.StringResource(this, "random-name", {
            length: 4,
            lower: true,
            upper: false,
            numeric: true,
            special: false,
        })

        // define resources here
        if (config.isLocal) {
            console.log("LocalStack Deploy")
            // LocalStack AWS Provider
            new AwsProvider(this, "aws", {
                region: config.region,
                accessKey: 'test',
                secretKey: 'test',
                s3UsePathStyle: true,
                endpoints: endpoints
            })
        } else {
            console.log("AWS Deploy")
            // AWS Live Deploy
            // Use S3Backend
            new S3Backend(this, {
                bucket: process.env.TERRAFORM_STATE_BUCKET ?? '',
                key: id,
                region: config.region
            })
            // Use AWS Provider with no LocalStack overrides
            new AwsProvider(this, "aws", {
                region: config.region
            })
        }
        // Bucket the lambda is going to get a list of objects from
        const listBucket = new S3Bucket(this, "list-bucket", {
            bucket: `${config.listBucketName}-${randomId.id}`,
        })

        const lambdaAssumeRolePolicy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow",
                    "Sid": ""
                },
            ]
        }

        const lambdaListBucketPolicy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": ["s3:ListBucket"],
                    "Sid": "AllowAccessObjectsToS3",
                    "Effect": "Allow",
                    "Resource": [`${listBucket.arn}/*`, listBucket.arn],
                },
            ]
        }


        // Create Lambda archive
        const asset = new TerraformAsset(this, "lambda-asset", {
            path: path.resolve(config.lambdaDistPath),
            type: AssetType.ARCHIVE, // if left empty it infers directory and file
        })

        // Create unique S3 bucket that hosts Lambda executable
        const bucket = new aws.s3Bucket.S3Bucket(this, "lambda-bucket", {
            bucketPrefix: `${config.listBucketName}-lambda`
        })

        // Upload Lambda zip file to newly created S3 bucket
        const lambdaArchive = new aws.s3Object.S3Object(this, "lambda-archive", {
            bucket: bucket.bucket,
            key: `${config.version}/${asset.fileName}`,
            source: asset.path, // returns a posix path
        })

        // Create Lambda role
        const role = new aws.iamRole.IamRole(this, "lambda-exec", {
            name: `lambda-role`,
            assumeRolePolicy: JSON.stringify(lambdaAssumeRolePolicy)
        })

        // Add ListBucket policy to Lambda role
        new aws.iamRolePolicy.IamRolePolicy(this, "lambda-rolepolicy", {
            role: role.name,
            policy: JSON.stringify(lambdaListBucketPolicy)
        })

        // Add execution role for lambda to write to CloudWatch logs
        new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, "lambda-managed-policy", {
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            role: role.name
        })


        // Default to LocalStack hot-reload magic bucket name and prefix to docker mountable path
        let lambdaBucketName = 'hot-reload'
        let lambdaS3Key = path.resolve(config.lambdaDistPath)
        // If not Local, use actual S3 bucket and key
        if (!config.isLocal) {
            lambdaBucketName = bucket.bucket
            lambdaS3Key = lambdaArchive.key
        }
        // Create Lambda function
        const lambdaFunc = new aws.lambdaFunction.LambdaFunction(this, "livedebug-lambda", {
            functionName: `name-lambda`,
            architectures: [arch],
            s3Bucket: lambdaBucketName,
            timeout: 15,
            s3Key: lambdaS3Key,
            handler: config.handler,
            runtime: config.runtime,
            environment: {variables: {'BUCKET': listBucket.bucket}},
            role: role.arn
        })

        // Create and configure API gateway
        const api = new aws.apigatewayv2Api.Apigatewayv2Api(this, "livedebug", {
            name: 'basic-api',
            protocolType: "HTTP",
            target: lambdaFunc.arn
        })

        new aws.lambdaPermission.LambdaPermission(this, "apigw-lambda", {
            functionName: lambdaFunc.functionName,
            action: "lambda:InvokeFunction",
            principal: "apigateway.amazonaws.com",
            sourceArn: `${api.executionArn}/*/*`,
        })

        new TerraformOutput(this, 'apigwUrl', {
            value: api.apiEndpoint
        })


        // Output the ECR Repository URL
        new TerraformOutput(this, "lambdaFuncName", {
            value: lambdaFunc.functionName,
        })
        // Output the ECR Repository URL
        new TerraformOutput(this, "bucketName", {
            value: listBucket.bucket,
        })

        // Create ALB Solution
        this.addAlbSolution()
    }


    //
    // Create an internal Application Load Balancer (ALB) that routes to a Lambda
    //
    private addAlbSolution() {
        // Create unique S3 bucket that hosts Lambda executable
        const alblogsBucket = new aws.s3Bucket.S3Bucket(this, "alblogs", {
            bucketPrefix: `alblogs`
        })
        const elbSvcAccount = new DataAwsElbServiceAccount(this, "elbSvcAccount", {})

        const currentAccountId = new DataAwsCallerIdentity(this, "currentAccount", {})
        const allowAlbBucketLogAccess = new DataAwsIamPolicyDocument(
            this,
            "allow_access_from_alb",
            {
                statement: [
                    {
                        effect: "Allow",
                        resources: [`${alblogsBucket.arn}/AWSLogs/${currentAccountId.accountId}/*`],
                        actions: ["s3:PutObject"],
                        principals: [
                            {
                                identifiers: [Token.asString(elbSvcAccount.arn)],
                                type: "AWS",
                            },
                        ],
                    },
                    {
                        effect: "Allow",
                        resources: [`${alblogsBucket.arn}/AWSLogs/${currentAccountId.accountId}/*`],
                        actions: ["s3:PutObject"],
                        principals: [
                            {
                                identifiers: ["delivery.logs.amazonaws.com"],
                                type: "Service",
                            },
                        ],
                        condition: [
                            {
                                test: "StringEquals",
                                variable: "s3:x-amz-acl",
                                values: ["bucket-owner-full-control"]
                            }
                        ]
                    },
                    {
                        effect: "Allow",
                        resources: [`${alblogsBucket.arn}`],
                        actions: ["s3:GetBucketAcl"],
                        principals: [
                            {
                                identifiers: ["delivery.logs.amazonaws.com"],
                                type: "Service",
                            },
                        ],
                    },
                ],
            }
        )
        const awsS3BucketPolicyAllowAccessFromAlb = new S3BucketPolicy(
            this,
            "allow_access_from_another_account_2",
            {
                bucket: alblogsBucket.id,
                policy: Token.asString(allowAlbBucketLogAccess.json),
            }
        )

        const privAlb = new Lb(this, "priv-alb", {
            accessLogs: {
                bucket: alblogsBucket.id,
                enabled: true,
                // prefix: "priv-lb",
            },
            enableDeletionProtection: true,
            internal: true,
            loadBalancerType: "application",
            name: "priv-lb",
            securityGroups: [this.config.vpc.defaultSecurityGroupIdOutput],
            subnets: Token.asList(this.config.vpc.privateSubnetsOutput),
            tags: {
                Environment: "dev",
            },
        })


        new TerraformOutput(this, "privAlbDnsName", {
            value: privAlb.dnsName,
        })
    }
}