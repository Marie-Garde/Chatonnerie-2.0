import { generateProtectedResourceMetadata, getPublicOrigin, metadataCorsOptionsRequestHandler } from 'mcp-handler'
import { AUTH_ISSUER } from './_lib/supabase.js'

export function GET(req: Request) {
  const metadata = generateProtectedResourceMetadata({
    authServerUrls: [AUTH_ISSUER],
    resourceUrl: `${getPublicOrigin(req)}/api/mcp`,
  })
  return Response.json(metadata, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

export const OPTIONS = metadataCorsOptionsRequestHandler()
