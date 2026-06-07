const MCP_CONFIG_SNIPPET = `{
  "mcpServers": {
    "songflow": {
      "command": "node",
      "args": ["<path-to-songflow>/mcp-server/dist/index.js"],
      "env": {}
    }
  }
}`;

export function McpInfoPanel() {
  return (
    <div className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold">MCP Server Configuration</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          The SongFlow MCP server exposes your album and track data to AI agents via the Model Context Protocol.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium">Data file location</p>
        <p className="text-xs text-muted-foreground">
          macOS: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">~/Library/Application Support/com.songflow.app/songflow-data.json</code>
        </p>
        <p className="text-xs text-muted-foreground">
          Linux: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">~/.local/share/com.songflow.app/songflow-data.json</code>
        </p>
        <p className="text-xs text-muted-foreground">
          Windows: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">%APPDATA%\com.songflow.app\songflow-data.json</code>
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium">Claude Code MCP config (<code className="font-mono">.mcp.json</code>)</p>
        <pre className="rounded-md border bg-background p-3 text-xs font-mono whitespace-pre overflow-auto">
          {MCP_CONFIG_SNIPPET}
        </pre>
        <p className="text-xs text-muted-foreground">
          See <code className="font-mono">mcp-server/README.md</code> for full setup instructions.
        </p>
      </div>
    </div>
  );
}
