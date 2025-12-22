import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { filename, fileType, fileSize } = await req.json();

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({
        success: false,
        message: "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP, PDF"
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (fileSize > maxSize) {
      return NextResponse.json({
        success: false,
        message: "File too large. Maximum size: 10MB"
      }, { status: 400 });
    }

    // Generate unique filename to prevent conflicts
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueFilename = `${timestamp}-${randomString}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: uniqueFilename,
      ContentType: fileType,
      ContentLength: fileSize,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes expiry

    return NextResponse.json({
      success: true,
      uploadURL: url,
      fileKey: uniqueFilename
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to generate pre-signed URL"
    }, { status: 500 });
  }
}