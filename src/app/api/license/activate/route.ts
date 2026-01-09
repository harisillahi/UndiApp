import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { serial_key, device_id } = await request.json();

    if (!serial_key || !device_id) {
      return NextResponse.json(
        { error: 'Serial key and device ID required' },
        { status: 400 }
      );
    }

    // Find license
    const { data: license, error: fetchError } = await supabase
      .from('UndiApp V1.2')
      .select('*')
      .eq('serial_key', serial_key)
      .single();

    if (fetchError || !license) {
      return NextResponse.json(
        { error: 'Kode lisensi tidak valid' },
        { status: 404 }
      );
    }

    // Check if already activated on different device
    if (license.device_id && license.device_id !== device_id) {
      return NextResponse.json(
        { error: 'Lisensi sudah diaktifkan di perangkat lain' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(license.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Lisensi sudah kadaluarsa' },
        { status: 400 }
      );
    }

    // Check if active
    if (!license.is_active) {
      return NextResponse.json(
        { error: 'Lisensi telah dicabut' },
        { status: 400 }
      );
    }

    // Activate license
    const { error: updateError } = await supabase
      .from('UndiApp V1.2')
      .update({
        device_id: device_id,
        last_validated: new Date().toISOString()
      })
      .eq('serial_key', serial_key);

    if (updateError) {
      return NextResponse.json(
        { error: 'Gagal mengaktifkan lisensi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expires_at: license.expires_at,
      client_name: license.client_name
    });
  } catch (error) {
    console.error('License activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
