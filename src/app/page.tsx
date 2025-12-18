import { redirect } from 'next/navigation';

// Maintenance configuration
const MAINTENANCE_MODE = false; // Set to false to disable maintenance

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Await searchParams in Next.js 15+
  const params = await searchParams;
  
  // Check for bypass parameter
  const bypassParam = params.bypass;
  const isAdminBypass = bypassParam === 'admin123';
  
  // Check if maintenance mode is enabled and no valid bypass
  if (MAINTENANCE_MODE && !isAdminBypass) {
    redirect('/maintenance');
  }
  
  redirect('/control-panel');
  return null;
}