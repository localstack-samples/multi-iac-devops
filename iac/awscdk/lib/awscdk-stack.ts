import * as cdk from 'aws-cdk-lib';
import {aws_s3 as s3} from 'aws-cdk-lib';
import {Construct} from 'constructs';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwscdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // The code that defines your stack goes here
        new s3.Bucket(this, 'MyFirstBucket', {
            versioned: true
        });
    }
}
