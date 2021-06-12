// Create clients and set shared const values outside of the handler.

// Get the DynamoDB table name from environment variables
const tableName = process.env.SAMPLE_TABLE;

// Create a DocumentClient that represents the query to add an item
const dynamodb = require('aws-sdk/clients/dynamodb');
const sns = require('aws-sdk/clients/sns');
const docClient = new dynamodb.DocumentClient();
const snsClient = new sns();

/**
 * A simple example includes a HTTP get method to get one item by id from a DynamoDB table.
 */
exports.generateOtpHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
    // All log statements are written to CloudWatch
    console.info('received:', event);

    // Get id and name from the body of the request
    const body = JSON.parse(event.body)
    const phoneNumber = body.phoneNumber;
    const otp = `${(Math.floor(Math.random() * 10000) + 10000).toString().substring(1)}`; //generate random 4-digit code
    const timestamp = (new Date()).toISOString();

    // Send code via SNS
    // Create publish parameters
    const smsParams = {
        Message: `Hello, your OTP code is ${otp}. Valid for 5 minutes`, /* required */
        PhoneNumber: phoneNumber,
    };

    // Create promise and SNS service object
    const publishTextPromise = await snsClient.publish(smsParams).promise();
    console.info(`Published SMS: ${publishTextPromise.MessageId}`)

    // Add the code to a DynamoDB table
    var params = {
        TableName: tableName,
        Item: {phoneNumber: phoneNumber, otp: otp, timestamp: timestamp}
    };
    const result = await docClient.put(params).promise();

    // Send success response to client
    const response = {
        statusCode: 200,
        body: event.body,
        headers: {
            "Access-Control-Allow-Headers" : "X-Forwarded-For, Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT"
        }
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}
