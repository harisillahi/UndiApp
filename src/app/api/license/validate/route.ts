import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { serial_key, device_id } = await request.json();

    const { data: license, error } = await supabase
      .from('UndiApp V1.2')
      .select('*')
      .eq('serial_key', serial_key)
      .single();

    if (error || !license) {
      return NextResponse.json({ valid: false });
    }

    const isValid =
      license.is_active &&
      license.device_id === device_id &&
      new Date(license.expires_at) > new Date();

    if (isValid) {
      // Update last validation time
      await supabase
        .from('UndiApp V1.2')
        .update({ last_validated: new Date().toISOString() })
        .eq('serial_key', serial_key);

      const daysRemaining = Math.ceil(
        (new Date(license.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      return NextResponse.json({
        valid: true,
        expires_at: license.expires_at,
        days_remaining: daysRemaining
      });
    }

    return NextResponse.json({ valid: false });
  } catch (error) {
    console.error('License validation error:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
