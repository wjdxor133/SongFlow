import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { useConfigStore } from "../store/useConfigStore";

const inputClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring transition-colors";

export function Settings() {
  const config = useConfigStore((s) => s.config);
  const isLoaded = useConfigStore((s) => s.isLoaded);
  const setAnthropicApiKey = useConfigStore((s) => s.setAnthropicApiKey);
  const clearAnthropicApiKey = useConfigStore((s) => s.clearAnthropicApiKey);

  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      useConfigStore.getState().init();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      setKeyInput(config.anthropicApiKey);
    }
  }, [isLoaded, config.anthropicApiKey]);

  const hasKey = config.anthropicApiKey.length > 0;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setAnthropicApiKey(keyInput.trim());
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    setIsSaving(true);
    try {
      await clearAnthropicApiKey();
      setKeyInput("");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6 overflow-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">API Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI 연동을 위한 API 키를 관리하세요.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Anthropic API Key</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              hasKey
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {hasKey ? "연결됨" : "미설정"}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          Claude API 키를 입력하면 앱 안에서 바로 AI를 사용할 수 있어요. 키는
          로컬에만 저장됩니다.
        </p>

        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="relative">
            <input
              className={`${inputClass} pr-10`}
              type={showKey ? "text" : "password"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-ant-..."
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowKey((v) => !v)}
              tabIndex={-1}
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "저장 중..." : "저장"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving || !hasKey}
              onClick={handleClear}
            >
              초기화
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground">
          API 키는 https://console.anthropic.com 에서 발급받을 수 있어요.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-5">
        <h2 className="text-base font-semibold">MCP 서버 방식 (개발자용)</h2>
        <p className="text-sm text-muted-foreground">
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
        </p>
      </div>
    </div>
  );
}
