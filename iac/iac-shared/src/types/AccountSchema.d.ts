/**
 * If you import a dependency which does not include its own type definitions,
 * TypeScript will try to find a definition for it by following the `typeRoots`
 * compiler option in tsconfig.json. For this project, we've configured it to
 * fall back to this folder if nothing is found in node_modules/@types.
 *
 * Often, you can install the DefinitelyTyped
 * (https://github.com/DefinitelyTyped/DefinitelyTyped) type definition for the
 * dependency in question. However, if no one has yet contributed definitions
 * for the package, you may want to declare your own. (If you're using the
 * `noImplicitAny` compiler options, you'll be required to declare it.)
 *
 * e.g.:
 * ```ts
 * import something from 'AccountSchema';
 * something();
 * ```
 */
declare module 'AccountSchema' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import {enums} from "@pulumi/awsx/types";
    import {ec2} from "@pulumi/awsx/types/input";
    import NatGatewayConfigurationArgs = ec2.NatGatewayConfigurationArgs;

    export interface AccountEntity {
        accountNum: string;
        accountName: string;
        description: string;
        regions?: (AccountConfig)[];
    }

    export enum AccountType {
        Sandbox = "SANDBOX",
        Nonprod = "NONPROD",
        Localstack = "LOCALSTACK",
        Test = "TEST",
        Uat = "UAT",
        Prod = "PROD",
    }

    export interface AccountConfig {
        region: string;
        accountType?: string;
        vpcName?: string;
        vpcConfig?: VpcConfig;
        tgwSubnetCIDR?: string;
        tgwAttachmentSubnets?: (string)[];
    }

    export interface VpcConfig {
        cidrBlock: string;
        numberOfAvailabilityZones: number;
        subnetSpecs?: (SubnetDefinition)[];
        subnetCidrMask?: number;
        enableDnsHostnames?: boolean;
        natGateways?: NatGatewayConfigurationArgs;
        tags?: any;

        [key: string]: any;
    }

    export interface SubnetDefinition {
        type: enums.ec2.SubnetType;
        name: string;
    }
}


