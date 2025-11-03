// Maintenance Check Script for Next.js
(function() {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Check if maintenance mode is enabled
    function checkMaintenanceMode() {
        // Skip check if we're already on maintenance page
        if (window.location.pathname.includes('maintenance.html')) {
            return;
        }
        
        // Check for admin bypass
        const urlParams = new URLSearchParams(window.location.search);
        const bypass = urlParams.get('bypass');
        
        if (window.MAINTENANCE_CONFIG && window.MAINTENANCE_CONFIG.enabled) {
            // Check admin bypass
            if (bypass === window.MAINTENANCE_CONFIG.adminBypass) {
                // Store bypass in sessionStorage for this session
                sessionStorage.setItem('maintenance_bypass', 'true');
                return;
            }
            
            // Check if bypass is stored in session
            if (sessionStorage.getItem('maintenance_bypass') === 'true') {
                return;
            }
            
            // Redirect to maintenance page
            window.location.href = '/maintenance.html';
        }
    }
    
    // Run check when script loads
    checkMaintenanceMode();
    
    // Also check periodically in case config changes
    setInterval(checkMaintenanceMode, 10000); // Check every 10 seconds
})();