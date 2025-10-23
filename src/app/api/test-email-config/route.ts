import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    gmailConfigured: {
      user: !!process.env.GMAIL_USER,
      password: !!process.env.GMAIL_APP_PASSWORD,
      userValue: process.env.GMAIL_USER || 'NOT SET',
      passwordLength: process.env.GMAIL_APP_PASSWORD?.length || 0,
      passwordHasSpaces: process.env.GMAIL_APP_PASSWORD?.includes(' ') || false,
    },
    fcmConfigured: {
      vapidKey: !!process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
      vapidKeyLength: process.env.NEXT_PUBLIC_FCM_VAPID_KEY?.length || 0,
    }
  });
}
