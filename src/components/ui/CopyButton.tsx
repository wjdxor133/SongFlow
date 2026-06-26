import { useState } from "react";
import { Copy, Check, X } from "lucide-react";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  function handleCopy() {
    const markCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    const markFailed = () => {
      setFailed(true);
      setTimeout(() => setFailed(false), 2000);
    };

    navigator.clipboard.writeText(text).then(markCopied).catch(() => {
      // Fallback for environments where navigator.clipboard is unavailable (e.g. Tauri WebView)
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.top = "0";
        textarea.style.left = "0";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        markCopied();
      } catch {
        // Surface the failure so the user knows copy did not succeed.
        markFailed();
      }
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title={failed ? "복사 실패" : "복사"}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : failed ? (
        <X className="h-3.5 w-3.5 text-red-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
