import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda';
import { queryDatabase } from './helper/db';
import S3 from 'aws-sdk/clients/s3.js';
import {parse} from "json2csv";

const s3 = new S3({
    region: 'ap-southeast-2',
    secretAccessKey: '',
    accessKeyId: '',
});

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const { templateId, dealershipId, startDate, endDate } = event.queryStringParameters || {};

        if (!templateId || !dealershipId || !startDate || !endDate) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required query parameters' }),
            };
        }

        console.log(event.queryStringParameters);

        const sampleData = [
            { templateId: templateId, dealershipId: dealershipId, startDate: startDate, endDate: endDate },
            { templateId: 1, dealershipId: 1, startDate: "2025-1-1", endDate: "2025-2-2" },
            { templateId: 2, dealershipId: 2, startDate: "2025-2-1", endDate: "2025-3-2" }
        ];

        // Upload CSV to S3
        const s3Key = `reports/${templateId}/${dealershipId}/${startDate}_${endDate}.csv`;
        const s3Bucket = "sample-csv-bucket";


        const csvData = generateCsv(sampleData);
        const result = await s3.putObject({
            Bucket: s3Bucket,
            Key: s3Key,
            Body: csvData,
            ContentType: 'text/csv',
        })
            .promise();
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Report generated successfully',
                s3Path: `s3://${s3Bucket}/${s3Key}`,
                result: JSON.stringify(result)
            }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error', error: JSON.stringify(error) }),
        };
    }
};
function generateCsv(data: Array<any>) {
    const fields = Object.keys(data[0]);
    return parse(data, { fields });
};