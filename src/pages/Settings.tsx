import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { useConfigStore } from "../store/useConfigStore";

export function Settings() {
  const navigate = useNavigate();
  const isLoaded = useConfigStore((s) => s.isLoaded);

  useEffect(() => {
    if (!isLoaded) {
      useConfigStore.getState().init();
    }
  }, [isLoaded]);

  return (
    <div className="flex h-full flex-col gap-6 p-6 overflow-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          온보딩과 연동 방식을 관리하세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>온보딩</CardTitle>
          </div>
          <CardDescription>
            가이드 샘플을 통해 SongFlow의 핵심 기능을 체험해볼 수 있어요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => navigate("/guided")}>
            🎵 가이드 다시 보기
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MCP 서버 방식 (개발자용)</CardTitle>
          <CardDescription>
            Claude Code나 Cursor를 사용한다면 MCP 서버로 연결할 수 있어요.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
              mcp-server/
            </code>{" "}
            디렉터리에서{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
              npm install &amp;&amp; npm run build
            </code>{" "}
            후{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
              .mcp.json
            </code>
            에 등록하세요.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
