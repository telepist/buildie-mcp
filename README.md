# Buildie MCP

MCP (Model Context Protocol) server for [Buildie](https://buildie.fi) construction management platform. Provides AI agents access to Buildie's Partner API for managing construction projects, photos, tasks, reports, memos, and more.

## Features

| Tool | Description |
|------|-------------|
| `list_projects` | List construction projects with filters (status, city, dates, etc.) |
| `get_project` | Get full details of a single project |
| `list_photos` | List photos with filters (project, user, date, text search) |
| `get_photo` | Get details of a single photo |
| `get_photo_download_url` | Get a temporary download URL for a photo |
| `list_tasks` | List tasks with filters (project, status, dates) |
| `get_task` | Get details of a single task |
| `list_reports` | List reports with filters (project, template, state, text search) |
| `get_report` | Get details of a single report |
| `get_report_download_url` | Get a temporary download URL for a report |
| `list_memos` | List memos (daily logs) with filters |
| `retrieve_or_create_memo` | Get or create a memo for a specific date and project |
| `list_categories` | List categories (company, project, workflow, etc.) |
| `get_category` | Get details of a single category |
| `list_users` | List users |
| `get_user` | Get details of a single user |
| `get_company` | Get company details |
| `list_worklists` | List worklists (work step templates) |
| `get_worklist` | Get details of a single worklist |

## Prerequisites

- Node.js 18+
- Buildie Partner API key

## Installation

```bash
git clone https://github.com/telepist/buildie-mcp.git
cd buildie-mcp
npm install
npm run build
```

## Getting a Partner API Key

1. Log in to [Buildie](https://live.buildie.fi)
2. Navigate to **Company** > **Integrations**
3. Scroll to **Partner API Keys**
4. Click **+ Add new** to create a new API key
5. Copy the generated token

## Usage with Claude Code

```bash
claude mcp add buildie -- npx -y buildie-mcp
```

Or if installed locally:

```bash
claude mcp add buildie -e BUILDIE_API_TOKEN=your-token-here -- node /path/to/buildie-mcp/dist/index.js
```

## Usage with Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "buildie": {
      "command": "node",
      "args": ["/path/to/buildie-mcp/dist/index.js"],
      "env": {
        "BUILDIE_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BUILDIE_API_TOKEN` | Yes | Your Buildie Partner API token |
| `BUILDIE_API_URL` | No | API base URL (default: `https://partner.live.buildie.fi`) |

## Development

```bash
npm run dev    # TypeScript watch mode
npm run build  # Build for production
npm start      # Run the server
```

## API Documentation

The full Buildie Partner API documentation is available at:
https://live.buildie.fi/api2/docs/partner/

## License

MIT
