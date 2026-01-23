interface AtenxionCredentials {
  userId?: string | number;
  customerId?: string | number;
  agentId?: string;
  agentchainId?: string;
}

interface AtenxionRequestBody {
  userId: string;
  customerId: string;
  agentId?: string;
  Authorization: string;
}

function resolveServerUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_ATENXION_API_URL || 'https://backend.atenxion.ai';
  }
  return process.env.NEXT_PUBLIC_ATENXION_API_URL || 'https://api.atenxion.com';
}

function resolveApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

function getHeaders(token: string | null): Record<string, string> | null {
  if (!token) return null;
  return {
    'Content-Type': 'application/json',
    'Authorization': `${token}`,
  };
}

export async function getToken(): Promise<{ token: string; scriptTag: string } | null> {
  const apiBaseUrl = resolveApiBaseUrl().replace(/\/$/, '');
  const response = await fetch(`${apiBaseUrl}/api/integrations/token`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  const body = (await response.json()) as { token?: string | null; iframe?: string | null };
  
  if (body.token && body.iframe) {
    return {
      token: body.token,
      scriptTag: body.iframe // iframe from API is actually scriptTag from MongoDB
    };
  }
  
  return null;
}

async function normalizeCredentials(
  credentials: AtenxionCredentials
): Promise<AtenxionRequestBody> {
  const userId = (credentials.customerId?.toString().trim() || credentials.userId?.toString().trim()) || "";
  const agentchainId = credentials.agentchainId?.trim();
  const customerId = credentials.customerId?.toString().trim() || userId;
  let agentId = credentials.agentId;

  // Fetch token and scriptTag from MongoDB
  const integrationData = await getToken();
  let resolvedToken: string | null = null;
  
  if (integrationData?.scriptTag) {
    console.log('[loginAtenxionUser] Extracting token and agentId from MongoDB scriptTag...');
    
    // Extract token from scriptTag
    const tokenMatch = integrationData.scriptTag.match(/token=([^&"']+)/);
    if (tokenMatch) {
      resolvedToken = tokenMatch[1];
      console.log('[loginAtenxionUser] ✓ Extracted token from scriptTag');
    }
    
    // Extract agentchainId from scriptTag if agentId not provided
    if (!agentId) {
      const agentIdMatch = integrationData.scriptTag.match(/agentchainId=([^&"']+)/);
      agentId = agentIdMatch ? agentIdMatch[1] : undefined;
      
      if (agentId) {
        console.log('[loginAtenxionUser] ✓ Extracted agentId (agentchainId) from scriptTag:', agentId);
      } else {
        console.log('[loginAtenxionUser] No agentchainId found in scriptTag');
      }
    }
  }
  
  // Fallback to contextKey if token not found in scriptTag
  if (!resolvedToken && integrationData?.token) {
    resolvedToken = integrationData.token;
    console.log('[loginAtenxionUser] Using token from contextKey (MongoDB)');
  }

  let customerToken = "";
  if (typeof window !== 'undefined') {
    // Token is stored directly as a string in localStorage, not as JSON
    const stored = localStorage.getItem("token");
    if (stored) {
      customerToken = stored;
    }
  }

  const body: AtenxionRequestBody = {
    userId,
    customerId,
    agentId: agentId || agentchainId,
    Authorization: `Bearer ${customerToken}`,
  };

  return body;
}

function handleError(error: any, defaultMessage: string): boolean {
  console.error('Atenxion Error:', error);
  if (error instanceof Error) {
    console.error('Atenxion API Error:', {
      message: error.message,
      stack: error.stack,
    });
  }
  return false;
}

export async function loginAtenxionUser(
  credentials: AtenxionCredentials,
  token?: string | null
): Promise<boolean> {
  const url = `${resolveServerUrl()}/api/post-login/user-login`;
  console.log("Atenxion login URL:", url);
  
  const requestBody = await normalizeCredentials(credentials);
  
  // Get token from MongoDB scriptTag (extracted in normalizeCredentials)
  const integrationData = await getToken();
  let resolvedToken: string | null = null;
  
  if (integrationData?.scriptTag) {
    const tokenMatch = integrationData.scriptTag.match(/token=([^&"']+)/);
    if (tokenMatch) {
      resolvedToken = tokenMatch[1];
    }
  }
  
  // Fallback to contextKey if token not in scriptTag
  if (!resolvedToken && integrationData?.token) {
    resolvedToken = integrationData.token;
  }
  
  const headers = getHeaders(resolvedToken);

  console.log("Atenxion API call:", {
    url,
    body: requestBody,
    headers,
    token: resolvedToken ? resolvedToken.substring(0, 20) + "..." : "none",
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers || undefined,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Atenxion API error: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();
    console.log("Atenxion login response:", responseData);
    return true;
  } catch (error) {
    console.error("Atenxion login failed:", error);
    return handleError(error, "Unable to log in to Atenxion");
  }
}
