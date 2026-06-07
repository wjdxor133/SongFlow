# SongFlow MCP Server

A local MCP (Model Context Protocol) server that exposes SongFlow's Album/Track data to AI agents like Claude Code, Cursor, and other MCP-compatible clients.

## Setup

### 1. Install dependencies

```bash
cd mcp-server
npm install
npm run build
```

### 2. Configure your MCP client

**Claude Code** (`.mcp.json` in your project or `~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "songflow": {
      "command": "node",
      "args": ["/path/to/SongFlow/mcp-server/dist/server.js"],
      "description": "SongFlow music production workspace"
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "songflow": {
      "command": "npx",
      "args": ["songflow-mcp"]
    }
  }
}
```

### 3. Data file location

The MCP server shares the same data file as the SongFlow app:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/com.wjdxor133.songflow/songflow-data.json` |
| Windows | `%APPDATA%\com.wjdxor133.songflow\songflow-data.json` |
| Linux | `~/.local/share/com.wjdxor133.songflow/songflow-data.json` |

**Important**: Launch the SongFlow app at least once before using the MCP server to initialize the data file.

## Available Tools

### Album Tools
- `list_albums` — List all albums
- `get_album(id)` — Get album with its tracks
- `create_album(title, genre, concept)` — Create a new album
- `update_album(id, title?, genre?, concept?)` — Update album fields
- `delete_album(id)` — Delete album and all its tracks

### Track Tools
- `list_tracks(albumId)` — List tracks in an album
- `get_track(id)` — Get track details
- `create_track(albumId, title, genre?, bpm?, key?, concept?, lyrics?)` — Create a track
- `update_track(id, ...)` — Update track including BPM, key, lyrics
- `delete_track(id)` — Delete a track

### Workflow Tools
- `save_agent_response(trackId, task, rawText)` — Save AI response; auto-parses JSON
- `get_track_prompts(trackId)` — Get generated Suno prompts for a track
- `save_suno_result(trackId, url, rating, memo?, isBestVersion?)` — Log a Suno result
- `get_agent_history(trackId)` — Get full agent request/response history
