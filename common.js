// common.js - Updated for Firestore
function getUserId() {
  const userData = localStorage.getItem('telegramUser');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.id || 'default'; // Use Telegram user ID if available
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  return 'default'; // Fallback for users without Telegram data
}

// Firestore balance management functions
async function initializeBalance() {
  const userId = getUserId();
  if (userId === 'default') return;
  
  try {
    // Check if user exists and has balance, if not initialize it
    const response = await fetch(`/api/user/balance?userId=${userId}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // Update balance display
        updateBalanceDisplay(data.balance);
        return;
      }
    }
    
    // If user doesn't exist or error, set to 0
    updateBalanceDisplay(0);
  } catch (error) {
    console.error('Error initializing balance:', error);
    updateBalanceDisplay(0);
  }
}

async function addToBalance(amount) {
  const userId = getUserId();
  if (userId === 'default') return 0;
  
  try {
    const response = await fetch('/api/user/add-balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        amount: amount,
        description: 'Referral bonus'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        updateBalanceDisplay(data.newBalance);
        return data.newBalance;
      }
    }
  } catch (error) {
    console.error('Error adding to balance:', error);
  }
  
  return 0;
}

function updateBalanceDisplay(balance) {
  const balanceValue = balance || 0;
  
  // Update balance on home page
  const homeBalanceElement = document.getElementById('balance-display');
  if (homeBalanceElement) {
    homeBalanceElement.textContent = balanceValue;
  }
  
  // Update other balance displays
  const otherBalanceElements = document.querySelectorAll('.text-4xl.font-bold');
  otherBalanceElements.forEach(element => {
    if (!element.id || element.id !== 'balance-display') {
      element.textContent = balanceValue;
    }
  });
}

async function deductFromBalance(amount) {
  const userId = getUserId();
  if (userId === 'default') return 0;
  
  try {
    const response = await fetch('/api/user/update-balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        amount: amount,
        type: 'deduct'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        updateBalanceDisplay(data.newBalance);
        return data.newBalance;
      } else {
        console.error('Failed to deduct balance:', data.error);
      }
    }
  } catch (error) {
    console.error('Error deducting from balance:', error);
  }
  
  return 0;
}

async function getCurrentBalance() {
  const userId = getUserId();
  if (userId === 'default') return 0;
  
  try {
    const response = await fetch(`/api/user/balance?userId=${userId}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data.balance;
      }
    }
  } catch (error) {
    console.error('Error getting current balance:', error);
  }
  
  return 0;
}

// Get bot username from Telegram data
function getBotUsername() {
  const userData = localStorage.getItem('telegramUser');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      // Check if we have the bot username in start_param or use default
      if (user.start_param && user.start_param.includes('_')) {
        // Extract bot username from start_param if available
        const parts = user.start_param.split('_');
        if (parts.length > 1) {
          return parts[0]; // Assuming format like "botname_ref123"
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  return 'PanCakey_robot'; // Default bot username
}

// Get referral code for the current user
function getReferralCode() {
  const userId = getUserId();
  return `ref${userId}`;
}

// Generate referral link
// In common.js - Keep it simple for generating links only
function generateReferralLink() {
  const botUsername = 'PanCakey_robot'; // Hardcode bot username for reliability
  const userId = getUserId();
  
  // Use direct user ID format (most reliable)
  return `https://t.me/${botUsername}?start=${userId}`;
}

// Initialize the referral system
async function initializeReferralSystem() {
    await processReferral();
}

// Utility function to format numbers
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Utility function to show loading state
function showLoading(element) {
  if (element) {
    const originalHTML = element.innerHTML;
    element.innerHTML = '<div class="loading-spinner"></div> Loading...';
    element.disabled = true;
    return () => {
      element.innerHTML = originalHTML;
      element.disabled = false;
    };
  }
  return () => {};
}

// Utility function to handle API errors
function handleApiError(error, fallbackMessage = 'An error occurred') {
  console.error('API Error:', error);
  // You can add toast notifications or other error handling here
  return fallbackMessage;
}