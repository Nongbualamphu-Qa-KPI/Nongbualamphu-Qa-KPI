import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { message, token, targetId } = await req.json();

        if (!message || !token || !targetId) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: message, token, or targetId'
            }, { status: 400 });
        }

        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                to: targetId,
                messages: [{ type: 'text', text: message }],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('LINE API Error:', errorData);
            return NextResponse.json({
                success: false,
                error: errorData.message || 'Failed to send message'
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Message sent successfully' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Send push error:', errorMessage);
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}
