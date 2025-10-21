// ban-check.js - Include this in ALL pages
console.log('🛡️ Security system loaded');

async function checkUserBanStatus() {
    try {
        const userData = localStorage.getItem('telegramUser');
        if (!userData) {
            console.log('⚠️ No user data in localStorage');
            return false;
        }
        
        const user = JSON.parse(userData);
        const userId = user.id;
        
        console.log('🔍 Running security check for:', userId);
        
        // Get fingerprint
        let fingerprint = 'unknown';
        if (window.FingerprintJS) {
            try {
                const fp = await FingerprintJS.load();
                const result = await fp.get();
                fingerprint = result.visitorId;
            } catch (e) {
                console.error('Fingerprint error:', e);
                fingerprint = 'error_' + Date.now();
            }
        }
        
        const response = await fetch('/api/security/check-ban', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                fingerprint: fingerprint,
                ip: 'auto'
            })
        });
        
        const data = await response.json();
        console.log('🛡️ Security check result:', data);
        
        if (data.banned) {
            console.log('🚫 USER BANNED - Redirecting to banned page');
            window.location.href = `banned.html?reason=${encodeURIComponent(data.reason)}&type=${data.type}`;
            return true;
        }
        
        console.log('✅ User passed security check');
        return false;
        
    } catch (error) {
        console.error('❌ Security check error:', error);
        return false;
    }
}

// Auto-run on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🛡️ Starting security check...');
    const isBanned = await checkUserBanStatus();
    if (isBanned) {
        console.log('🛑 Page loading stopped - user banned');
        // Stop all other initialization
        document.body.innerHTML = '<div style="padding: 20px; text-align: center;">Security check in progress...</div>';
        return;
    }
    console.log('✅ Security check passed, continuing page load');
});