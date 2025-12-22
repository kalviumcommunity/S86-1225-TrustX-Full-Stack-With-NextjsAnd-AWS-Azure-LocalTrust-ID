import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// TODO: Implement proper authentication
// import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  try {
    const { fileName, fileKey, fileSize, fileType } = await req.json();

    // TODO: Get userId from authentication
    // For now, using a placeholder - you should implement proper auth
    const userId = 1; // Replace with actual user ID from auth

    // Construct the public URL (assuming bucket is public)
    // For private files, you'd need to generate signed URLs for access
    const fileURL = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    const record = await prisma.file.create({
      data: {
        name: fileName,
        url: fileURL,
        size: fileSize,
        type: fileType,
        userId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      file: record
    });
  } catch (error) {
    console.error('Error storing file metadata:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to store file metadata"
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // TODO: Get userId from authentication
    const userId = 1; // Replace with actual user ID from auth

    const files = await prisma.file.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      files: files
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch files"
    }, { status: 500 });
  }
}