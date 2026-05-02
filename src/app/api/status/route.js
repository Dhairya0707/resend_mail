import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: "online",
        engine: "MailDispatch Next.js 1.0",
        pnpm: true
    });
}
