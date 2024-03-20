interface TerraformOutput {
    cloudfront_domain_name: {
        sensitive: boolean;
        type: string;
        value: string;
    };
}

export default TerraformOutput