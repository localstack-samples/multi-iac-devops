import * as path from 'path'
import {loadAndExtractCloudfrontDomain} from './helpers'

const filePath = path.resolve(__dirname, '../../iac/terraform/hcl/react-ui/terraform_output.json')

// Example usage
const cloudfrontDomain = loadAndExtractCloudfrontDomain(filePath)
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