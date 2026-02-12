'use client';

import { useEffect, useState, useMemo } from 'react';
import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { integrationsApi, Integration } from '../lib/api/integrations';
import { useAuth } from '../contexts/AuthContext';

export default function IntegrationWidget() {
  const { user, isAuthenticated, loading } = useAuth();
  
  const [processedIframes, setProcessedIframes] = useState<Array<{
    integration: Integration;
    src: string;
    title: string;
    allow?: string | null;
    loading?: string | null;
  }>>([]);

  // Only load for CUSTOMER role (wait for auth to load first)
  // Memoize to prevent unnecessary re-renders
  const shouldLoad = useMemo(() => {
    return !loading && isAuthenticated && user?.role === 'CUSTOMER';
  }, [loading, isAuthenticated, user?.role]);

  // Fetch integrations (all hooks must be called before any conditional returns)
  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsApi.getAll,
    enabled: shouldLoad,
  });

  // Process script tags and inject them
  useEffect(() => {
    if (!shouldLoad || !integrations || integrations.length === 0) {
      return;
    }

    const activeIntegrations = integrations.filter((integration: Integration) => integration.isActive);

    activeIntegrations.forEach((integration: Integration) => {
      if (!integration.scriptTag) return;

      const embedCode = integration.scriptTag.trim();
      const integrationId = integration._id || `integration-${Date.now()}`;

      // Handle script tags
      if (embedCode.startsWith('<script')) {
        const scriptId = `integration-script-${integrationId}`;
        
        // Remove existing script if present
        const existingScript = document.getElementById(scriptId);
        if (existingScript) {
          existingScript.remove();
        }

        // Extract src from script tag
        const scriptTagMatch = embedCode.match(/<script[^>]+src=["']([^"']+)["']/i);
        
        if (scriptTagMatch) {
          // Extract the script src URL
          let scriptSrc = scriptTagMatch[1];
          
          // Add userId and authToken parameters if user is logged in
          // The chat widget should read authToken from URL and use it in Authorization header:
          // Authorization: Bearer <authToken>
          if (user?.id) {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            try {
              const url = new URL(scriptSrc, window.location.origin);
              url.searchParams.set("userId", String(user.id));
              if (token) {
                url.searchParams.set("authToken", token);
              }
              scriptSrc = url.toString();
            } catch {
              const separator = scriptSrc.includes("?") ? "&" : "?";
              scriptSrc = `${scriptSrc}${separator}userId=${String(user.id)}`;
              if (token) {
                scriptSrc += `&authToken=${encodeURIComponent(token)}`;
              }
            }
          }

          // Create new script element with updated src
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = scriptSrc;
          script.async = true;
          document.head.appendChild(script);
        } else {
          // Inline script content
          const contentMatch = embedCode.match(/>(.*?)<\/script>/s);
          if (contentMatch) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.textContent = contentMatch[1];
            document.head.appendChild(script);
          }
        }
      }
    });

    // Cleanup function
    return () => {
      activeIntegrations.forEach((integration: Integration) => {
        if (integration.scriptTag?.trim().startsWith('<script')) {
          const scriptId = `integration-script-${integration._id || `integration-${Date.now()}`}`;
          const script = document.getElementById(scriptId);
          if (script) {
            script.remove();
          }
        }
      });
    };
  }, [integrations, user?.id, shouldLoad]);

  // Process iframe integrations
  useEffect(() => {
    if (!shouldLoad || !integrations || integrations.length === 0) {
      setProcessedIframes((prev) => {
        // Only update if there's a change to prevent infinite loops
        if (prev.length === 0) return prev;
        return [];
      });
      return;
    }

    const activeIntegrations = integrations.filter((integration: Integration) => integration.isActive);

    const processed = activeIntegrations
      .filter((integration: Integration) => {
        return integration.scriptTag?.trim().startsWith('<iframe');
      })
      .map((integration: Integration) => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = integration.scriptTag || '';
        const iframe = wrapper.querySelector('iframe');

        if (!iframe) return null;

        const srcAttr = iframe.getAttribute('src');
        if (!srcAttr) return null;

        let sanitizedSrc = srcAttr.trim();
        
        // Inject userId and authToken into iframe URL if user is logged in
        // The chat widget should read authToken from URL params and use it in API calls:
        // Authorization: Bearer <authToken>
        // Or listen for postMessage with type 'AUTH_TOKEN' to receive the token
        const userId = user?.id;
        if (userId) {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          try {
            const url = new URL(sanitizedSrc, window.location.origin);
            url.searchParams.set('userId', String(userId));
            if (token) {
              url.searchParams.set('authToken', token);
            }
            sanitizedSrc = url.toString();
          } catch {
            if (!sanitizedSrc.includes('userId=')) {
              const separator = sanitizedSrc.includes('?') ? '&' : '?';
              sanitizedSrc = `${sanitizedSrc}${separator}userId=${String(userId)}`;
              if (token) {
                sanitizedSrc += `&authToken=${encodeURIComponent(token)}`;
              }
            }
          }
        }

        return {
          integration,
          src: sanitizedSrc,
          title: iframe.getAttribute('title') || integration.name || 'Integration Widget',
          allow: iframe.getAttribute('allow'),
          loading: iframe.getAttribute('loading'),
        };
      })
      .filter((item) => item !== null) as Array<{
        integration: Integration;
        src: string;
        title: string;
        allow?: string | null;
        loading?: string | null;
      }>;

    // Only update state if the processed iframes actually changed
    setProcessedIframes((prev) => {
      // Compare by checking if lengths match and all IDs match
      if (prev.length !== processed.length) {
        return processed;
      }
      
      const prevIds = prev.map(p => p.integration._id).sort().join(',');
      const newIds = processed.map(p => p.integration._id).sort().join(',');
      
      if (prevIds !== newIds) {
        return processed;
      }
      
      // Check if any src changed
      const prevSrcs = prev.map(p => p.src).sort().join('|||');
      const newSrcs = processed.map(p => p.src).sort().join('|||');
      
      if (prevSrcs !== newSrcs) {
        return processed;
      }
      
      // No changes, return previous state to prevent re-render
      return prev;
    });
  }, [integrations, user?.id, shouldLoad]);

  // Send auth token to iframes via postMessage (more secure than URL parameter)
  useEffect(() => {
    if (!shouldLoad || processedIframes.length === 0 || !user?.id) {
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    // Send token to all iframes via postMessage
    const sendTokenToIframes = () => {
      processedIframes.forEach((iframeData) => {
        // Find the iframe element by its src
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          if (iframe.src.includes(iframeData.src) || iframe.src === iframeData.src) {
            try {
              iframe.contentWindow?.postMessage({
                type: 'AUTH_TOKEN',
                token: token,
                userId: user.id,
                timestamp: Date.now()
              }, '*'); // Use specific origin in production for better security
            } catch (error) {
              console.warn('Failed to send token to iframe:', error);
            }
          }
        });
      });
    };

    // Send immediately
    sendTokenToIframes();

    // Also send after a short delay to ensure iframe is loaded
    const timeoutId = setTimeout(sendTokenToIframes, 1000);

    // Listen for iframe ready message and resend token
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'IFRAME_READY') {
        sendTokenToIframes();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('message', handleMessage);
    };
  }, [processedIframes, user?.id, shouldLoad]);

  // Don't render anything if not a customer or no iframes found
  if (!shouldLoad || processedIframes.length === 0) {
    return null;
  }

  return (
    <>
      {processedIframes.map((iframeData, index: number) => (
        <Box
          key={iframeData.integration._id || `iframe-${index}`}
          component="div"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 9999,
            width: '400px',
            height: '600px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 32px)',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            '@media (max-width: 600px)': {
              width: 'calc(100vw - 32px)',
              height: 'calc(100vh - 32px)',
              bottom: 16,
              right: 16,
            },
          }}
        >
          <iframe
            src={iframeData.src}
            title={iframeData.title}
            allow={iframeData.allow || undefined}
            loading={(iframeData.loading === 'lazy' || iframeData.loading === 'eager') ? iframeData.loading : 'lazy'}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </Box>
      ))}
    </>
  );
}
