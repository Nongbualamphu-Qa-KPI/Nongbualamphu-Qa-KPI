
import { NextResponse } from "next/server";
import { CREDENTIALS } from "@/lib/auth-config";

export async function POST(request: Request) {
    try {
        const { departmentId, password } = await request.json();

        if (!departmentId || !password) {
            return NextResponse.json(
                { success: false, error: "กรุณาระบุรหัสแผนกและรหัสผ่าน" },
                { status: 400 }
            );
        }

        const correctPassword = CREDENTIALS[departmentId];

        if (correctPassword && correctPassword === password) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: "รหัสผ่านไม่ถูกต้อง" },
                { status: 401 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "เกินข้อผิดพลาดในระบบ" },
            { status: 500 }
        );
    }
}
