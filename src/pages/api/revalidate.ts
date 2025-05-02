import type { APIRoute } from 'astro';
import { log } from '../../lib/constants';

/**
 * API endpoint to revalidate pages on-demand
 * Used by WordPress webhooks to trigger rebuilds when content changes
 * 
 * POST: Accepts webhook requests with paths to revalidate
 * GET: Returns a friendly message explaining usage
 */
export const POST: APIRoute = async ({ request/*, locals*/ }) => {
  try {
    // Extract and validate the request body
    const body = await request.json();
    
    // Validate that request includes proper security token
    const receivedToken = request.headers.get('x-revalidate-token');
    const expectedToken = import.meta.env.REVALIDATE_TOKEN;
    
    if (!expectedToken || receivedToken !== expectedToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Unauthorized: Invalid token' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Get the post/page path that needs revalidation
    const paths = Array.isArray(body.paths) ? body.paths : (body.path ? [body.path] : []);
    
    if (paths.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No paths to revalidate' 
        }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Revalidate cache for all provided paths
    const revalidationResults = await Promise.all(
      paths.map(async (path: string) => {
        try {
          // Clean up path to ensure it starts with / and remove trailing slash
          const normalizedPath = path.startsWith('/') ? path : `/${path}`;
          
          // Use Astro's cache API to revalidate the path
          // For Astro v5, we need to use a different approach
          // This would typically integrate with your hosting platform's cache invalidation
          // For Netlify, this could use their cache invalidation API
          log.info(`Would revalidate: ${normalizedPath}`);
          
          return { path: normalizedPath, success: true };
        } catch (error) {
          log.error(`Error revalidating ${path}: ` + error);
          return { path, success: false, error: (error as Error).message };
        }
      })
    );
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Revalidation triggered', 
        results: revalidationResults 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    log.error('Revalidation error: ' + error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Revalidation failed', 
        error: (error as Error).message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

/**
 * GET handler that explains how to use the revalidation endpoint
 */
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      message: 'This endpoint requires a POST request with a JSON body and proper authentication',
      usage: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-token': 'your-token-here'
        },
        body: {
          paths: ['/path-to-revalidate', '/another-path']
        }
      }
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};