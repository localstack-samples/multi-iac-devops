import {Vpc} from "./.gen/modules/vpc"
import {AssetType, Fn, S3Backend, TerraformAsset, TerraformOutput, TerraformStack, Token} from "cdktf"
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
import {Instance} from "@cdktf/provider-aws/lib/instance"
import {SecurityGroup} from "@cdktf/provider-aws/lib/security-group"
import {IamInstanceProfile} from "@cdktf/provider-aws/lib/iam-instance-profile"
import {IamRole} from "@cdktf/provider-aws/lib/iam-role"
import {DataAwsAmi} from "@cdktf/provider-aws/lib/data-aws-ami"

export interface JumphostStackConfig {
    isLocal: boolean;
    environment: string;
    instanceType: string;
    region: string;
    vpc: Vpc;
}

export class JumphostStack extends TerraformStack {
    private config: JumphostStackConfig

    constructor(scope: Construct, id: string, config: JumphostStackConfig) {
        super(scope, id)
        this.config = config
        console.log('config', config)

        // Create Random provider
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
        const assumeRole = new DataAwsIamPolicyDocument(this, "assume_role", {
            statement: [
                {
                    actions: ["sts:AssumeRole"],
                    effect: "Allow",
                    principals: [
                        {
                            identifiers: ["ec2.amazonaws.com"],
                            type: "Service",
                        },
                    ],
                },
            ],
        })
        const role = new IamRole(this, "role", {
            assumeRolePolicy: Token.asString(assumeRole.json),
            name: "ec2-jump-role",
            path: "/",
        })
        // Add execution role for lambda to write to CloudWatch logs
        new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, "ec2-ssm-policy", {
            policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
            role: role.name
        })
        const jumpProfile = new IamInstanceProfile(this, "ec2-jump-profile", {
            name: "ec2-jump-profile",
            role: role.name,
        })

        const ec2Sg = new SecurityGroup(this, "ec2sb", {
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

        const amznLinux2023Ami = new DataAwsAmi(this, "amzn-linux-2023-ami", {
            filter: [
                {
                    name: "name",
                    values: ["al2023-ami-2023.*-x86_64"],
                },
            ],
            mostRecent: true,
            owners: ["amazon"],
        })
        const ec2Instance = new Instance(this, "compute", {
            ami: Token.asString(amznLinux2023Ami.id),
            instanceType: config.instanceType, //"t2.micro"
            associatePublicIpAddress: false,
            subnetId: Fn.element(Token.asList(this.config.vpc.privateSubnetsOutput), 0),
            vpcSecurityGroupIds: [ec2Sg.id],
            iamInstanceProfile: jumpProfile.name
        })

        // Output the ECR Repository URL
        new TerraformOutput(this, "jumphost-id", {
            value: ec2Instance.id,
        })
        // Output the ECR Repository URL
        new TerraformOutput(this, "jumphost-priv-ip", {
            value: ec2Instance.privateIp,
        })

    }
}