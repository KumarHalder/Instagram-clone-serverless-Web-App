import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid';
//import { strict } from 'assert';
//import { getUserId } from '../utils';

const docClient = new AWS.DynamoDB.DocumentClient()
const s3 = new AWS.S3({
    signatureVersion: 'v4'
})

//const todoTable = process.env.TODO_TABLE
const imagesTable = process.env.IMAGES_TABLE
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

// export async function getSignedUrl(userId:string,postId:string): Promise<string[]> {
//     const imageId = uuidv4()
//     const newItem = await createImage(userId, postId, imageId,{});
//     // console.log(newItem);
//     const url = getUploadUrl(imageId)
//     return [url,newItem.imageUrl]
// }

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Caller event', event)
    const postId = event.pathParameters.postId
    //   const userId = getUserId(event);
    const userId = 'ss'

    //const itemExist = await postExists(postId, userId);
    //const validGroupId = itemExist[0];



    // if (!validGroupId) {
    //     return {
    //         statusCode: 404,
    //         headers: {
    //             'Access-Control-Allow-Origin': '*',
    //             'Access-Control-Allow-Credentials': true
    //         },
    //         body: JSON.stringify({
    //             error: 'Post does not exist'
    //         })
    //     }
    // }

    //const item = itemExist[1];
    //console.log('to do item', item)
    const imageId = uuidv4()
    const newItem = await createImage(userId, postId, imageId)

    const url = getUploadUrl(imageId)

    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true

        },
        body: JSON.stringify({
            newItem: newItem,
            uploadUrl: url
        })
    }
}

// async function postExists(postId: string, userId: string) {
//     const result = await docClient
//         .get({
//             TableName: todoTable,
//             Key: {
//                 userId: userId,
//                 postId: postId
//             }
//         })
//         .promise()

//     console.log('Get group: ', result)
//     return [!!result.Item, JSON.stringify(result)]
// }

async function createImage(userId: string, postId: string, imageId: string) {
    const timestamp = new Date().toISOString()
    //const newImage = JSON.parse(item)

    const newItem = {
        userId,
        postId,
        timestamp,
        imageId,
       
        imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`
    }
    console.log('Storing new item: ', newItem)
    //Put item in image imagetable
    await docClient
        .put({
            TableName: imagesTable,
            Item: newItem
        })
        .promise()
    //  Update item attachmentURL in postTable
    // var params = {
    //     TableName: todoTable,
    //     Key: {
    //         "userId": userId,
    //         "postId": postId

    //     },
    //     UpdateExpression: "set #attachmentURL = :n",
    //     ExpressionAttributeValues: {
    //         ":n": `https://${bucketName}.s3.amazonaws.com/${imageId}`
    //     },
    //     ExpressionAttributeNames: {
    //         "#attachmentURL": "attachmentUrl"
    //     },
    //     ReturnValues: "UPDATED_NEW"
    // };
    // await docClient.update(params, function (err, data) {
    //     if (err) {
    //         console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    //         return {
    //             statusCode: 404,
    //             headers: {
    //                 'Access-Control-Allow-Origin': '*'
    //             },
    //             body: 'Unable to delete'

    //         }
    //     } else {
    //         console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    //     }
    // }).promise();

    return newItem
}

function getUploadUrl(imageId: string) {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: imageId,
        Expires: parseInt(urlExpiration)
    })
}