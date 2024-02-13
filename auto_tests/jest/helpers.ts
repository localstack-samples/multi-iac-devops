import fs from "fs"
import TerraformOutput from "./types"

export const loadAndExtractCloudfrontDomain = (filePath: string): string | null => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const terraformOutput: TerraformOutput = JSON.parse(fileContent)
        console.log('Terraform output:', terraformOutput)

        // Extract cloudfront_domain_name.value
        const cloudfrontDomainValue = terraformOutput?.cloudfront_domain_name?.value

        return cloudfrontDomainValue || null
    } catch (error: any) {
        console.error('Error loading or parsing JSON file:', error.message)
        return null
    }
}

