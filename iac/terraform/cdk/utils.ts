import {Fn} from "cdktf";


function getSubnetCidrBlocks(cidrPrefix: string,
                             subnetCount: number,
                             newbits: number,
                             netNumStart: number) {
    const subnetCidrBlocks: string[] = [];

    for (let index = 0; index < subnetCount; index++) {
        subnetCidrBlocks[index] = Fn.cidrsubnet(cidrPrefix, newbits, netNumStart + index);
    }

    return subnetCidrBlocks;
}

export {getSubnetCidrBlocks};