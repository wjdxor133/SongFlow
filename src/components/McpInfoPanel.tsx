import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible";

const MCP_CONFIG_SNIPPET = `{
  "mcpServers": {
    "songflow": {
      "command": "node",
      "args": ["<path-to-songflow>/mcp-server/dist/server.js"]
    }
  }
}`;

export function McpInfoPanel() {
  return (
    <Collapsible className="rounded-lg border bg-muted/10">
      <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors [&[data-panel-open]>svg]:rotate-180">
        <span>MCP 서버 연결 가이드</span>
        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
      </CollapsibleTrigger>

      <CollapsibleContent className="px-3 pb-4 flex flex-col gap-3 border-t">
        <p className="mt-3 text-xs text-muted-foreground">
          Claude Code나 Cursor에서 SongFlow 데이터에 직접 접근할 수 있어요.
        </p>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium">1. MCP 서버 빌드</p>
          <pre className="rounded-md border bg-background p-2 text-xs font-mono">
            cd mcp-server && npm install && npm run build
          </pre>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium">2. Claude Code에 등록</p>
          <pre className="rounded-md border bg-background p-2 text-xs font-mono whitespace-pre overflow-auto">
            {MCP_CONFIG_SNIPPET}
          </pre>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium">데이터 파일 위치</p>
          <p className="text-xs text-muted-foreground font-mono">
            macOS: ~/Library/Application Support/com.wjdxor133.songflow/songflow-data.json
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
