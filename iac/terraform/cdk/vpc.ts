import {Construct} from "constructs"
import {TerraformStack, Fn, TerraformOutput, S3Backend} from "cdktf"
import * as aws from "@cdktf/provider-aws"
import {Vpc} from "./.gen/modules/vpc"
import {AccountEntity, AccountConfig, VpcConfig, getAccountConfig, getSubnetCidrBlocks} from '../../iac-shared'

import * as random from "@cdktf/provider-random"
import {AwsProvider} from "@cdktf/provider-aws/lib/provider"
import {endpoints} from "./ls-endpoints"

const nameLabel = "Vpc"
const nameIdentifier = "vpc"

interface VpcStackConfig {
    isLocal: boolean;
    vpcConfigPath: string;
    region: string;
    accountType: string;
}


/**
 * Terraform stack
 */
export class VpcStack extends TerraformStack {
    userInput: any
    config: VpcStackConfig
    vpc: Vpc
    alblogsBucket: aws.s3Bucket.S3Bucket

    /**
     * Constructor for the terraform stack
     *
     * @param {Construct} scope
     * @param {string} name
     */
    constructor(scope: Construct, id: string, config: VpcStackConfig) {
        super(scope, id)

        this.userInput = {}
        this.config = config

        // Create NullProvider to run CMD Line
        // new Null.provider.NullProvider(this, 'Null');
        new random.provider.RandomProvider(this, "random")


        // define resources here
        if (config.isLocal) {
            console.log("LocalStack Deploy")
            // LocalStack AWS Provider
            new AwsProvider(this, "AWS", {
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
            new AwsProvider(this, "AWS", {
                region: config.region
            })
        }

        this.vpc = this._createVpc()

        // Create S3 bucket for ALB logs
        this.alblogsBucket = new aws.s3Bucket.S3Bucket(this, "alblogs", {
            bucketPrefix: `alblogs`
        })
    }

    /**
     * Create VPC
     *
     * @sets this.vpcOutput - output from the created vpc
     * @private
     */
    _createVpc() {
        let account: AccountEntity = getAccountConfig(this.config.vpcConfigPath)
        console.log("account: ", account)
        let regionConfig = account ? account.regions?.find((item: AccountConfig) => (item.region == this.config.region && item.accountType?.toLowerCase() == this.config.accountType.toLowerCase())) : undefined
        console.log("region: ", regionConfig)

        let vpcDef: VpcConfig
        vpcDef = regionConfig?.vpcConfig!

        const zones = new aws.dataAwsAvailabilityZones.DataAwsAvailabilityZones(this, 'zones', {
            state: 'available'
        })

        let azs: string[] = []
        for (let i = 0; i < vpcDef.numberOfAvailabilityZones; i++) {
            let zone = Fn.element(zones.names, i)
            new TerraformOutput(this, `zone-${i}`, {
                value: zone
            })
            azs.push(zone)
        }
        const privateSubnetCidrBlocks = getSubnetCidrBlocks(
            vpcDef.cidrBlock,
            vpcDef.numberOfAvailabilityZones,
            8,
            0
        )

        const publicSubnetCidrBlocks = getSubnetCidrBlocks(
            vpcDef.cidrBlock,
            vpcDef.numberOfAvailabilityZones,
            8,
            vpcDef.numberOfAvailabilityZones
        )


        const vpcOptions = {
            name: nameLabel,
            azs: azs,
            cidr: vpcDef.cidrBlock,
            publicSubnets: publicSubnetCidrBlocks,
            publicSubnetTags: {
                "Name": nameLabel + " public"
            },
            privateSubnets: privateSubnetCidrBlocks,
            privateSubnetTags: {
                "Name": nameLabel + " private"
            },
            enableNatGateway: true,
            singleNatGateway: true,
            enableDnsHostnames: true
        }

        const vpcLocal = new Vpc(this, nameIdentifier, vpcOptions)

        // new TerraformOutput(this, "privSubnetIds", {
        //     value: vpc.privateSubnetsOutput,
        // })

        new TerraformOutput(this, `publicSubnets`, {
            value: vpcLocal.publicSubnets
        })
        new TerraformOutput(this, `privateSubnets`, {
            value: vpcLocal.privateSubnets
        })
        return vpcLocal
    }
}
