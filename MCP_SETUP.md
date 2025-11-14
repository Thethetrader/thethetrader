# MCP Setup Guide

This project now has Netlify and Supabase MCPs configured for Cursor.

## Configuration File Location
- **Cursor Global Config**: `/Users/theodorebrey/.cursor/mcp.json`

## Setup Steps

### Netlify MCP ✅
- **Status**: Ready to use
- **Authentication**: Automatic via Netlify CLI or prompted when needed
- **Capabilities**: 
  - Create, deploy, and manage Netlify projects
  - Manage project settings and configurations
  - Install/uninstall Netlify extensions
  - Create environment variables and secrets
  - Enable and manage form submissions

### Supabase MCP 🔧
- **Status**: Requires configuration

#### Required Steps:
1. **Get Personal Access Token**:
   - Visit: https://supabase.com/dashboard/account/tokens
   - Click "Generate new token"
   - Name it "Cursor MCP Server"
   - Copy the token

2. **Get Project Reference**:
   - Go to your Supabase project dashboard
   - Navigate to Settings > General
   - Copy the Project ID

3. **Update Configuration**:
   Replace the placeholders in `/Users/theodorebrey/.cursor/mcp.json`:
   ```json
   "project-ref=YOUR_PROJECT_REF_HERE"  → "project-ref=your-actual-project-id"
   "YOUR_SUPABASE_TOKEN_HERE"           → "your-actual-token"
   ```

#### Capabilities:
- **Database Operations**: List tables, execute SQL, apply migrations
- **Project Management**: Create projects, pause/restore projects
- **Edge Functions**: List and deploy Edge Functions
- **Configuration**: Get project URLs, API keys
- **Development**: Generate TypeScript types, search docs
- **Branching**: Create/manage development branches (requires paid plan)

## Usage

After setup, restart Cursor and you'll be able to ask your AI assistant to:
- "Deploy this to Netlify"
- "Create a new table in my Supabase database"
- "Get my Supabase project configuration"
- "Generate TypeScript types for my database schema"

## Security Notes
- The Supabase MCP is configured in `--read-only` mode by default for safety
- Your tokens are stored in the MCP configuration file - keep this secure
- Consider using environment variables for tokens if committing config to version control 