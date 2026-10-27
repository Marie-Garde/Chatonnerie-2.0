import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { registerTools, SERVER_INSTRUCTIONS } from './_lib/tools.js'
import { verifyToken } from './_lib/supabase.js'

const handler = createMcpHandler(registerTools, {
  serverInfo: { name: 'chatonnerie', version: '1.0.0' },
  instructions: SERVER_INSTRUCTIONS,
})

const authHandler = withMcpAuth(handler, verifyToken, { required: true })

export { authHandler as GET, authHandler as POST, authHandler as DELETE }
