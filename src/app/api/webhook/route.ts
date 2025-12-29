import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const events = body.events;

        for (const event of events) {
            // เช็คว่าพิมพ์คำว่า !id หรือไม่
            if (event.type === 'message' && event.message.type === 'text') {
                if (event.message.text.trim() === '!id') {
                    const targetId = event.source.groupId || event.source.userId;
                    const replyToken = event.replyToken;

                    // ดึง Token จาก Environment หรือไฟล์ settings
                    const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "6PikKaXZ0yw3qIThSdf8XguOhe/+6E88reeIAZK23u+iIwJphopyupJNBXWqJh7r3/xKdjJ97EGUvJigeyXTk+cU78TMouCQ3mEEUXU7iupt9UGBbWznDYGyBoocgJ2Wu7z1ugFox+9rL9XIRkAs2wdB04t89/1O/w1cDnyilFU=";

                    await fetch('https://api.line.me/v2/bot/message/reply', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        },
                        body: JSON.stringify({
                            replyToken: replyToken,
                            messages: [{
                                type: 'text',
                                text: `🆔 ID ของกลุ่มนี้คือ:\n\n${targetId}\n\n(ก๊อปปี้ไปใส่ในระบบ Admin ได้เลยครับ)`
                            }],
                        }),
                    });
                }
            }
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
    }
}

// รองรับ GET สำหรับ LINE webhook verification
export async function GET() {
    return NextResponse.json({ status: 'Webhook is active' });
}
