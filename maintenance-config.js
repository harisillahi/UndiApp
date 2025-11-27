const MAINTENANCE_CONFIG = {
    enabled: false,              // Change to true to enable
    message: "Pardon our dust!",
    description: "We are performing a quick system upgrade and should be back in a moment. Please check back shortly.",
    estimatedTime: "",
    contact: "haris.illahi@gmail.com",
    adminBypass: "admin123"      // URL bypass key
};

// For Node.js/Next.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MAINTENANCE_CONFIG;
}

// For browser environments
if (typeof window !== 'undefined') {
    window.MAINTENANCE_CONFIG = MAINTENANCE_CONFIG;
}