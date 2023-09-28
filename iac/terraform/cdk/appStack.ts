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
import {LbListener} from "@cdktf/provider-aws/lib/lb-listener"
import {LbTargetGroup} from "@cdktf/provider-aws/lib/lb-target-group"
import {LambdaPermission} from "@cdktf/provider-aws/lib/lambda-permission"
import {LbTargetGroupAttachment} from "@cdktf/provider-aws/lib/lb-target-group-attachment"
import {SecurityGroup} from "@cdktf/provider-aws/lib/security-group"
import {LambdaLayerVersion} from "@cdktf/provider-aws/lib/lambda-layer-version"

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
    alblogsBucket: aws.s3Bucket.S3Bucket;
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
                    "Effect": "Allow",
                    "Action": ["s3:ListBucket"],
                    "Resource": [`${listBucket.arn}/*`, listBucket.arn],
                    "Sid": "AllowAccessObjectsToS3",
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ec2:DescribeInstances",
                        "ec2:CreateNetworkInterface",
                        "ec2:AttachNetworkInterface",
                        "ec2:DescribeNetworkInterfaces",
                        "autoscaling:CompleteLifecycleAction",
                        "ec2:DeleteNetworkInterface"
                    ],
                    "Resource": "*",
                    "Sid": "AllowInVpc",
                }
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

        const layer =
            new LambdaLayerVersion(this, "lambda_layer", {
                compatibleRuntimes: ["nodejs18.x"],
                filename: path.resolve("../../../src/common_layer/common_layer.zip"),
                layerName: "common_layer_name",
            })
        // Create Lambda function
        const lambdaFuncAlb = new aws.lambdaFunction.LambdaFunction(this, "alb-lambda", {
            functionName: `alb-lambda`,
            architectures: [arch],
            s3Bucket: lambdaBucketName,
            timeout: 15,
            s3Key: lambdaS3Key,
            handler: config.handler,
            runtime: config.runtime,
            layers: [layer.arn],
            vpcConfig: {
                subnetIds: Token.asList(this.config.vpc.privateSubnetsOutput),
                securityGroupIds: [this.config.vpc.defaultSecurityGroupIdOutput]
            },
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
        this.addAlbSolution(lambdaFuncAlb)
    }


    //
    // Create an internal Application Load Balancer (ALB) that routes to a Lambda
    //
    private addAlbSolution(lambdaFuncAlb: aws.lambdaFunction.LambdaFunction) {
        // Get the AWS Load Balancer Service account
        const elbSvcAccount = new DataAwsElbServiceAccount(this, "elbSvcAccount", {})
        // Get the current AWS account
        const currentAccountId = new DataAwsCallerIdentity(this, "currentAccount", {})
        // Allow ALB to put objects into the S3 logging bucket. There are 3 types of policy statements to use here. See below.
        const allowAlbBucketLogAccess = new DataAwsIamPolicyDocument(
            this,
            "allow_access_from_alb",
            {
                // See AWS docs here: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html
                statement: [
                    // Regions available as of August 2022 or later
                    {
                        effect: "Allow",
                        resources: [`${this.config.alblogsBucket.arn}/privlb/AWSLogs/${currentAccountId.accountId}/*`],
                        actions: ["s3:PutObject"],
                        principals: [
                            {
                                identifiers: ["logdelivery.elasticloadbalancing.amazonaws.com"],
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
                    // Regions available before August 2022
                    {
                        effect: "Allow",
                        resources: [`${this.config.alblogsBucket.arn}/privlb/AWSLogs/${currentAccountId.accountId}/*`],
                        actions: ["s3:PutObject"],
                        principals: [
                            {
                                identifiers: [Token.asString(elbSvcAccount.arn)],
                                type: "AWS",
                            },
                        ],
                    },
                    // Outposts Zones
                    {
                        effect: "Allow",
                        resources: [`${this.config.alblogsBucket.arn}/privlb/AWSLogs/${currentAccountId.accountId}/*`],
                        actions: ["s3:PutObject"],
                        principals: [
                            {
                                identifiers: ["logdelivery.elb.amazonaws.com"],
                                type: "Service",
                            },
                        ],
                    },
                ],
            }
        )
        // Attach ALB log access policy to S3 logging bucket
        const awsS3BucketPolicyAllowAccessFromAlb = new S3BucketPolicy(
            this,
            "allow-alb-s3-log-policy",
            {
                bucket: this.config.alblogsBucket.id,
                policy: Token.asString(allowAlbBucketLogAccess.json),
            }
        )
        // Allow port 80 from private subnets inbound to ALB
        const privAlbSg = new SecurityGroup(this, "ec2sb", {
            ingress: [
                {
                    cidrBlocks: [this.config.vpc.cidr || '10.42.0.0/16'],
                    fromPort: 80,
                    ipv6CidrBlocks: ["::/0"],
                    protocol: "TCP",
                    toPort: 80,
                },
            ],
            egress: [
                {
                    cidrBlocks: ["0.0.0.0/0"],
                    fromPort: 0,
                    ipv6CidrBlocks: ["::/0"],
                    protocol: "-1",
                    toPort: 0,
                },
            ],
            vpcId: this.config.vpc.vpcIdOutput
        })
        // Create private Application Load Balancer (ALB)
        const privAlb = new Lb(this, "priv-alb", {
            accessLogs: {
                bucket: this.config.alblogsBucket.id,
                enabled: true,
                prefix: "privlb",
            },
            enableDeletionProtection: false,
            internal: true,
            loadBalancerType: "application",
            name: "priv-lb",
            securityGroups: [privAlbSg.id],
            subnets: Token.asList(this.config.vpc.privateSubnetsOutput),
            tags: {
                Environment: "dev",
            },
        })
        // Create ALB Target Group for Lambda
        const awsLbTargetGroupFrontEnd = new LbTargetGroup(this, "alb-tgroup",
            {
                targetType: "lambda"
            })
        // Create ALB listener and set the default action to hit the Lambda Target Group
        const awsLbListenerFrontEnd = new LbListener(this, "alb-listener", {
            defaultAction: [
                {
                    targetGroupArn: Token.asString(awsLbTargetGroupFrontEnd.arn),
                    type: "forward",
                },
            ],
            loadBalancerArn: privAlb.arn,
            port: Token.asNumber("80")
        })
        // All the ALB to invoke the Lambda
        const albInvokePerm = new LambdaPermission(this, "alb-invoke-func-perm", {
            action: "lambda:InvokeFunction",
            functionName: lambdaFuncAlb.functionName,
            principal: "elasticloadbalancing.amazonaws.com",
            sourceArn: Token.asString(awsLbTargetGroupFrontEnd.arn),
            statementId: "AllowExecutionFromlb",
        })
        // TargetGroupAttachment of TargetGroup to Lambda
        const awsLbTargetGroupAttachmentTest = new LbTargetGroupAttachment(
            this,
            "alb-tgroup-attch",
            {
                dependsOn: [albInvokePerm],
                targetGroupArn: Token.asString(awsLbTargetGroupFrontEnd.arn),
                targetId: lambdaFuncAlb.arn,
            }
        )

        new TerraformOutput(this, "privAlbDnsName", {
            value: privAlb.dnsName,
        })
    }
}