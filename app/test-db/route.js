import { query } from '@/lib/db';

export async function GET() {
    try {
        const results = await query('SELECT * FROM destinations');
        return Response.json({ success: true, data: results });
    } catch (error) {
        return Response.json({ success: false, error: error.message });
    }
}