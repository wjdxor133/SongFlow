import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { useConfigStore } from "../store/useConfigStore";

export function Settings() {
  const navigate = useNavigate();
  const config = useConfigStore((s) => s.config);
  const isLoaded = useConfigStore((s) => s.isLoaded);
  const setAnthropicApiKey = useConfigStore((s) => s.setAnthropicApiKey);
  const clearAnthropicApiKey = useConfigStore((s) => s.clearAnthropicApiKey);
  const setSpotifyCredentials = useConfigStore((s) => s.setSpotifyCredentials);
  const clearSpotifyCredentials = useConfigStore((s) => s.clearSpotifyCredentials);

  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [spotifyClientId, setSpotifyClientId] = useState("");
  const [spotifyClientSecret, setSpotifyClientSecret] = useState("");
  const [showSpotifySecret, setShowSpotifySecret] = useState(false);
  const [isSavingSpotify, setIsSavingSpotify] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      useConfigStore.getState().init();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      setKeyInput(config.anthropicApiKey);
      setSpotifyClientId(config.spotifyClientId ?? "");
      setSpotifyClientSecret(config.spotifyClientSecret ?? "");
    }
  }, [isLoaded, config.anthropicApiKey, config.spotifyClientId, config.spotifyClientSecret]);

  const hasKey = config.anthropicApiKey.length > 0;
  const hasSpotify = !!(config.spotifyClientId && config.spotifyClientSecret);

  async function handleSaveSpotify(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingSpotify(true);
    try {
      await setSpotifyCredentials(spotifyClientId.trim(), spotifyClientSecret.trim());
    } finally {
      setIsSavingSpotify(false);
    }
  }

  async function handleClearSpotify() {
    setIsSavingSpotify(true);
    try {
      await clearSpotifyCredentials();
      setSpotifyClientId("");
      setSpotifyClientSecret("");
    } finally {
      setIsSavingSpotify(false);
    }
  }

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
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Anthropic API Key</CardTitle>
            <Badge
              className={
                hasKey
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : ""
              }
              variant={hasKey ? "outline" : "secondary"}
            >
              {hasKey ? "연결됨" : "미설정"}
            </Badge>
          </div>
          <CardDescription>
            Claude API 키를 입력하면 앱 안에서 바로 AI를 사용할 수 있어요. 키는
            로컬에만 저장됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div className="relative">
              <Input
                className="pr-10"
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Spotify API</CardTitle>
            <Badge
              className={
                hasSpotify
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : ""
              }
              variant={hasSpotify ? "outline" : "secondary"}
            >
              {hasSpotify ? "연결됨" : "미설정"}
            </Badge>
          </div>
          <CardDescription>
            앨범 불러오기 기능에 사용돼요. developer.spotify.com에서 앱을 만들고 Client ID/Secret을 발급받으세요. 무료로 사용 가능합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form onSubmit={handleSaveSpotify} className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Client ID</label>
              <Input
                value={spotifyClientId}
                onChange={(e) => setSpotifyClientId(e.target.value)}
                placeholder="Spotify Client ID"
                autoComplete="off"
                spellCheck={false}
                disabled={isSavingSpotify}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Client Secret</label>
              <div className="relative">
                <Input
                  className="pr-10"
                  type={showSpotifySecret ? "text" : "password"}
                  value={spotifyClientSecret}
                  onChange={(e) => setSpotifyClientSecret(e.target.value)}
                  placeholder="Spotify Client Secret"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={isSavingSpotify}
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setShowSpotifySecret((v) => !v)}
                  tabIndex={-1}
                >
                  {showSpotifySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isSavingSpotify || !spotifyClientId.trim() || !spotifyClientSecret.trim()}>
                {isSavingSpotify ? "저장 중..." : "저장"}
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={isSavingSpotify || !hasSpotify} onClick={handleClearSpotify}>
                초기화
              </Button>
            </div>
          </form>
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
