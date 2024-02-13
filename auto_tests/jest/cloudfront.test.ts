import * as fs from 'fs'
import * as path from 'path'
import TerraformOutput from './types'

const filePath = path.resolve(__dirname, '../../iac/terraform/hcl/react-ui/terraform_output.json')

const loadAndExtractCloudfrontDomain = (): string | null => {
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

// Example usage
const cloudfrontDomain = loadAndExtractCloudfrontDomain()
const CLOUDFRONT_URL = `https://${cloudfrontDomain}`

test('CloudFront distribution test', async () => {

    try {
        await page.goto(CLOUDFRONT_URL, {waitUntil: 'networkidle2'})

        // Assuming your default React content has a specific string
        const content = await page.content()
        expect(content).toContain('Web site created using create-react-app')
    } catch (error: any) {
        console.error('Error during test:', error.message)
        throw error
    }
})