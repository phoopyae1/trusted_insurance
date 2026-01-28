const axios = require('axios');

const ATENXION_API_URL = process.env.NEXT_PUBLIC_ATENXION_API_URL;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;

/**
 * Fetches the latest active integration token (contextKey) from the API endpoint
 * @returns {Promise<string|null>} contextKey token or null
 */
async function fetchLatestIntegrationEmbed() {
  try {
    const apiBaseUrl = BACKEND_URL.replace(/\/$/, '');
    const response = await axios.get(`${apiBaseUrl}/api/integrations/token`);
 
    if (response.status === 404) {
      return null;
    }

    if (!response.data || !response.data.success) {
      return null;
    }

    const token = response.data.token;
    console.log('token', token);
    if (token && token.trim().length > 0) {
      return token.trim();
    }

    return null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error('Error fetching integration token from API:', error.message);
    return null;
  }
}

/**
 * Records a transaction to Atenxion API when certain events happen
 * (e.g., client bought product, claim submitted, claim approved)
 * 
 * @param {string|number} userId - The user ID (studentId/customerId) to record transaction for
 * @param {string} eventType - Type of event (e.g., 'POLICY_PURCHASED', 'CLAIM_SUBMITTED', 'CLAIM_APPROVED')
 * @returns {Promise<boolean>} Returns true if transaction was recorded successfully, false otherwise
 */
async function recordAtenxionTransaction(userId, eventType = 'TRANSACTION') {
  if (!ATENXION_API_URL) {
    console.warn('⚠️ ATENXION_API_URL not configured - skipping transaction recording');
    return false;
  }

  const url = `${ATENXION_API_URL}/api/post-login/new-transaction`;
  const body = {
    userId: String(userId).trim(),
    eventType: eventType,
  };

  let atenxionToken = '';

  try {
    atenxionToken = await fetchLatestIntegrationEmbed();
  } catch (error) {
    console.warn('Failed to fetch integration token, using fallback:', error.message);
    // Don't throw error, just log it - we'll try with empty token or skip
  }

  // If no token found, log warning and skip the API call
  if (!atenxionToken || atenxionToken.length === 0) {
    console.warn(`⚠️ Atenxion token not found - skipping transaction recording for user ${userId}, event: ${eventType}`);
    return false;
  }

  const headers = {
    Authorization: atenxionToken,
    'Content-Type': 'application/json',
  };

  try {
    console.log('📤 Recording Atenxion transaction:', {
      url,
      userId: body.userId,
      eventType: body.eventType,
      token: atenxionToken ? `${atenxionToken.substring(0, 16)}...` : 'none',
    });

    const response = await axios.post(url, body, { headers });
    const data = response?.data ?? {};
    console.log('✅ Transaction recorded successfully:', data);
    return true;
  } catch (error) {
    // Log error but don't throw - we don't want to break the main flow
    console.error('❌ Failed to record Atenxion transaction:', {
      userId: body.userId,
      eventType: body.eventType,
      error: error.response?.data || error.message,
    });
    return false;
  }
}

/**
 * Logs out a user from Atenxion API
 * 
 * @param {string|number} userId - The user ID (studentId/customerId) to logout
 * @param {string|null} token - Optional token to use (if not provided, will fetch from integration)
 * @returns {Promise<boolean>} Returns true if logout was successful, false otherwise
 */
async function logoutAtenxionUser(userId, token = null) {
  if (!ATENXION_API_URL) {
    console.warn('⚠️ ATENXION_API_URL not configured - skipping Atenxion logout');
    return false;
  }

  const url = `${ATENXION_API_URL}/api/post-login/user-logout`;
  
  // Get token from integration if not provided
  let atenxionToken = token;
  if (!atenxionToken) {
    try {
      atenxionToken = await fetchLatestIntegrationEmbed();
    } catch (error) {
      console.warn('Failed to fetch integration token for logout:', error.message);
    }
  }

  // If no token found, log warning and skip the API call
  if (!atenxionToken || atenxionToken.length === 0) {
    console.warn(`⚠️ Atenxion token not found - skipping logout for user ${userId}`);
    return false;
  }

  // Normalize credentials - userId and customerId are the same
  const body = {
    userId: String(userId).trim(),
    customerId: String(userId).trim(),
  };

  const headers = {
    Authorization: atenxionToken,
    'Content-Type': 'application/json',
  };

  try {
    console.log('📤 Atenxion logout API call:', {
      url,
      body,
      token: atenxionToken ? `${atenxionToken.substring(0, 16)}...` : 'none',
    });

    const response = await axios.post(url, body, { headers });
    console.log('✅ Atenxion logout successful:', response.data);
    return true;
  } catch (error) {
    // Log error but don't throw - we don't want to break the main logout flow
    console.error('❌ Atenxion logout failed:', {
      userId: body.userId,
      error: error.response?.data || error.message,
    });
    return false;
  }
}

module.exports = {
  recordAtenxionTransaction,
  fetchLatestIntegrationEmbed,
  logoutAtenxionUser,
};
