"use client";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="bg-[#0a0f24] border border-border rounded-lg p-4 font-mono text-xs text-muted">
      Loading editor...
    </div>
  ),
});

type Props = {
  code: string;
  language?: string;
  height?: number;
};

export default function CodeEditor({ code, language = "java", height = 220 }: Props) {
  return (
    <div className="border border-border rounded-lg overflow-hidden" style={{ height }}>
      <MonacoEditor
        height={height}
        language={language}
        theme="vs-dark"
        value={code}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineNumbers: "on",
          automaticLayout: true,
          wordWrap: "on",
        }}
      />
    </div>
  );
}
