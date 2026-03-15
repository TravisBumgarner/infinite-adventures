import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import config from "../config.js";

const s3Client = new S3Client({
  region: config.awsRegion,
  credentials: {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
  },
});

export async function generatePresignedPutUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: config.s3BucketName,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 900 });
}

export async function generatePresignedGetUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.s3BucketName,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: config.s3BucketName,
    Key: key,
  });
  await s3Client.send(command);
}

export async function getS3Object(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: config.s3BucketName,
    Key: key,
  });
  const response = await s3Client.send(command);
  const stream = response.Body;
  if (!stream) {
    throw new Error(`No body returned for S3 object: ${key}`);
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
