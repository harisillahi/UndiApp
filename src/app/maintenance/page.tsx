"use client";

export default function MaintenancePage() {
  return (
    <div style={{
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#333',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <div style={{
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '60px 40px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        width: '90%',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#667eea',
          marginBottom: '20px'
        }}>
          🎲 UndiApp
        </div>
        
        <div style={{
          fontSize: '80px',
          color: '#667eea',
          marginBottom: '30px',
          animation: 'spin 3s linear infinite'
        }}>
          ⚙️
        </div>
        
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          Pardon our dust!
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#666',
          lineHeight: '1.6',
          marginBottom: '40px'
        }}>
          We are performing a quick system upgrade and should be back in a moment. 
          Please check back shortly.
        </p>
        
        <div style={{
          margin: '40px 0'
        }}>
          <div style={{
            width: '100%',
            height: '6px',
            background: '#e0e0e0',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '15px'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
              borderRadius: '3px',
              animation: 'loading 2s ease-in-out infinite'
            }} />
          </div>
          <p style={{
            fontSize: '14px',
            color: '#888'
          }}>
            System upgrade in progress...
          </p>
        </div>
        
        <div style={{
          marginTop: '40px',
          paddingTop: '30px',
          borderTop: '1px solid #eee'
        }}>
          <p style={{
            color: '#888',
            fontSize: '14px',
            marginBottom: '10px'
          }}>
            Need immediate assistance?
          </p>
          <a 
            href="mailto:haris.illahi@gmail.com" 
            style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            haris.illahi@gmail.com
          </a>
        </div>
        
        <div style={{
          marginTop: '20px',
          fontSize: '12px',
          color: '#aaa'
        }}>
          <p>⟳ This page will automatically refresh every 30 seconds</p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}