import * as config from "AccountSchema";


// export {NetworkConfig, AccountEntity, NetworkVpc, VpcConfig, AccountType, Regions, AccountConfig} from "./NetworkSchema";
// export const accountConfig: config.AccountEntity = accounts;

import * as fs from 'fs';

export const getAccountConfig = (jsonFile: string): config.AccountEntity => {
    let rawdata = fs.readFileSync(jsonFile);
    let account = JSON.parse(rawdata.toString()) as config.AccountEntity;
    return account;
}

