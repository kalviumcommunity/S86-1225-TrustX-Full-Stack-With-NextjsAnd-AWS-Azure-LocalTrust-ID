import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "../../../../lib/prisma";
import { sendWelcomeEmail } from "../../../../lib/emailService";
import { logger } from "../../../../lib/logger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role = "USER" } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return NextResponse.json({ success: false, message: "User already exists" }, { status: 400 });

    // Validate role
    if (!["USER", "ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, message: "Invalid role" }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });

    // Send welcome email asynchronously (don't block response)
    sendWelcomeEmail(email, name)
      .then((result) => {
        if (result.success) {
          logger.info(`Welcome email sent to ${email}`, { messageId: result.messageId });
        } else {
          logger.warn(`Failed to send welcome email to ${email}`, { error: result.error });
        }
      })
      .catch((error) => {
        logger.error(`Error sending welcome email to ${email}`, { error: error.message });
      });

    return NextResponse.json({ success: true, message: "Signup successful", user: newUser });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Signup failed", error }, { status: 500 });
  }
}