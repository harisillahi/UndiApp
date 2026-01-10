export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-2xl text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">UndiApp V1.2</h1>
        <p className="text-gray-600 mb-6">Sistem Undian Digital Professional</p>
        <a 
          href="/control-panel" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Buka Control Panel
        </a>
      </div>
    </div>
  );
}