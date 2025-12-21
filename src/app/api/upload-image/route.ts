import { NextRequest, NextResponse } from 'next/server';

// ImgBB API endpoint
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

// You can get a free API key from https://api.imgbb.com/
// For now, using a demo key (you should replace this with your own)
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'd2f1c9f6e8c3b5a7d9e4f2a8c1b6e3d7'; // Replace with your key

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const image = body.image as string;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // Upload to ImgBB
    const uploadFormData = new FormData();
    uploadFormData.append('key', IMGBB_API_KEY);
    uploadFormData.append('image', base64Data);

    const response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      url: data.data.url,
      displayUrl: data.data.display_url,
      deleteUrl: data.data.delete_url,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
