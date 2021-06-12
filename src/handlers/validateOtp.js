// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
const dynamodb = require('aws-sdk/clients/dynamodb');
const docClient = new dynamodb.DocumentClient();

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
exports.validateOtpHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get the phone number and OTP that the user entered
    const body = JSON.parse(event.body);
    const phoneNumber = body.phoneNumber;
    const otp = body.otp;
    const requestTimestamp = new Date();


    // Get the item from the table
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property
    var params = {
        TableName: tableName,
        Key: {phoneNumber: phoneNumber, otp: otp},
    };
    const data = await docClient.get(params).promise();
    if(!data.Item){
        throw new Error("Invalid number/OTP combination");
    }

    const item = data.Item;

    // Validate request was received within 5 mins from the record
    const otpTimestamp = item.timestamp;
    // diff in milliseconds
    const diff = requestTimestamp - new Date(otpTimestamp);
    const diffInMins = Math.floor((diff / 1000) / 60);
    if (diffInMins > 5) {
        throw new Error("OTP has expired");
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify({message: "Token accepted"})
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}
