import React, { useState } from "react";
import { Helmet } from "react-helmet-async";

// 클립보드 복사 함수
function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    // fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return Promise.resolve();
  }
}

// JSON 문법 하이라이트 함수 (dangerouslySetInnerHTML 없이 span으로 반환)
function syntaxHighlightLine(line: string) {
  // key: "...":, string: "...", number: 123, boolean: true/false, null: null
  const regex =
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      elements.push(line.slice(lastIndex, match.index));
    }
    let cls = "json-number";
    if (/^"/.test(match[0])) {
      if (/:$/.test(match[0])) {
        cls = "json-key";
      } else {
        cls = "json-string";
      }
    } else if (/true|false/.test(match[0])) {
      cls = "json-boolean";
    } else if (/null/.test(match[0])) {
      cls = "json-null";
    }
    elements.push(
      <span className={cls} key={match.index}>
        {match[0]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) {
    elements.push(line.slice(lastIndex));
  }
  return elements;
}

export default function JsonFormat() {
  const [input, setInput] = useState("");
  const [space, setSpace] = useState(2);
  const [fontSize, setFontSize] = useState(15);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [, setErrorPos] = useState<number | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [, setErrorCol] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);

  // 줄 분리 함수 (CRLF/LF/CR 모두 대응)
  const splitLines = (str: string) => str.split(/\r\n|\n|\r/);

  const handleFormat = () => {
    setShowResult(true);
    // 줄바꿈 통일
    const normalizedInput = input.replace(/\r\n|\r/g, "\n");
    try {
      const obj = JSON.parse(normalizedInput);
      setOutput(JSON.stringify(obj, null, space));
      setError("");
      setErrorPos(null);
      setErrorLine(null);
      setErrorCol(null);
    } catch (e: any) {
      setOutput("");
      const match = e.message.match(/position (\d+)/);
      let pos: number | null = null;
      let line: number | null = null;
      let col: number | null = null;
      if (match) {
        pos = parseInt(match[1], 10);
        const before = normalizedInput.slice(0, pos);
        const lines = splitLines(before);
        line = lines.length;
        col = lines[lines.length - 1].length + 1;
      }
      setError(
        "유효한 JSON이 아닙니다." +
          (line && col ? ` (오류 위치: ${line}행 ${col}열)` : "")
      );
      setErrorPos(pos);
      setErrorLine(line);
      setErrorCol(col);
    }
  };

  // 줄 번호 + 오류 줄 하이라이트 (성공/실패 모두)
  let linesToShow: React.ReactNode = null;
  let linesSource = output ? output : input.replace(/\r\n|\r/g, "\n");
  let errorLineToHighlight = errorLine;
  const [wrapCounts, setWrapCounts] = useState<number[]>([]);
  const codeRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useLayoutEffect(() => {
    if (!showResult || !linesSource) return;
    setWrapCounts(
      (linesSource ? splitLines(linesSource) : []).map((_, idx) => {
        const el = codeRefs.current[idx];
        if (!el) return 1;
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        return Math.round(el.offsetHeight / lineHeight) || 1;
      })
    );
    // eslint-disable-next-line
  }, [showResult, linesSource, fontSize]);

  if (showResult && linesSource) {
    const lines = splitLines(linesSource);
    linesToShow = (
      <div style={{ width: "100%" }}>
        {lines.map((line, i) => {
          const wraps = wrapCounts[i] || 1;
          return (
            <React.Fragment key={i}>
              {/* 첫 줄: 줄 번호 + 코드 */}
              <div style={{ display: "flex" }}>
                <div
                  style={{
                    width: 36,
                    textAlign: "right",
                    color: "#888",
                    userSelect: "none",
                    paddingRight: 8,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  ref={(el) => (codeRefs.current[i] = el)}
                  style={{
                    background:
                      errorLineToHighlight === i + 1 ? "#ff4f4f" : undefined,
                    color: errorLineToHighlight === i + 1 ? "#fff" : undefined,
                    borderRadius: 4,
                    paddingLeft: 2,
                    minHeight: fontSize * 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    width: "100%",
                  }}
                >
                  {syntaxHighlightLine(line) || "\u00A0"}
                </div>
              </div>
              {/* 워드랩 줄: 줄 번호 대신 빈 칸 + 빈 코드 줄 */}
              {Array.from({ length: wraps - 1 }).map((_, j) => (
                <div style={{ display: "flex" }} key={j + "_wrap"}>
                  <div
                    style={{
                      width: 36,
                      textAlign: "right",
                      color: "#888",
                      userSelect: "none",
                      paddingRight: 8,
                    }}
                  >
                    &nbsp;
                  </div>
                  <div
                    style={{
                      minHeight: fontSize * 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      width: "100%",
                    }}
                  />
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>JSON 포맷터 - 툴박스</title>
        <meta
          name="description"
          content="JSON 데이터를 보기 좋게 포맷하고, 오류 위치를 알려주는 무료 JSON 포맷터 툴입니다."
        />
      </Helmet>
      <div
        style={{
          maxWidth: 720,
          margin: "40px auto",
          background: "#23272b",
          borderRadius: 16,
          boxShadow: "0 4px 24px 0 rgba(0,0,0,0.18)",
          padding: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            fontWeight: 700,
            fontSize: 24,
            marginBottom: 20,
            color: "#e5e7eb",
          }}
        >
          JSON 포맷터
        </h2>
        <div
          style={{
            width: "100%",
            marginBottom: 16,
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <label style={{ color: "#e5e7eb", fontSize: 15 }}>
            스페이스:
            <input
              type="number"
              min={0}
              max={8}
              value={space}
              onChange={(e) => setSpace(Number(e.target.value))}
              style={{
                width: 48,
                marginLeft: 6,
                padding: 4,
                borderRadius: 6,
                border: "1px solid #333",
                background: "#181c1f",
                color: "#fff",
              }}
            />
          </label>
          <label style={{ color: "#e5e7eb", fontSize: 15 }}>
            폰트크기:
            <input
              type="number"
              min={10}
              max={32}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{
                width: 48,
                marginLeft: 6,
                padding: 4,
                borderRadius: 6,
                border: "1px solid #333",
                background: "#181c1f",
                color: "#fff",
              }}
            />{" "}
            px
          </label>
          <button
            onClick={handleFormat}
            style={{
              padding: "6px 18px",
              fontSize: 15,
              background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)",
              color: "#181c1f",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px 0 rgba(243,244,246,0.12)",
            }}
          >
            포맷
          </button>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="여기에 JSON 데이터를 붙여넣으세요"
          style={{
            width: "100%",
            minHeight: 120,
            fontSize: 15,
            border: "1px solid #333",
            borderRadius: 8,
            background: "#181c1f",
            color: "#fff",
            marginBottom: 16,
            padding: 12,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
        {showResult && error && (
          <div style={{ color: "#ff4f4f", marginBottom: 12 }}>{error}</div>
        )}
        <div
          style={{
            width: "100%",
            minHeight: 120,
            background: "#181c1f",
            color: "#e5e7eb",
            borderRadius: 8,
            border: "1px solid #333",
            fontSize: fontSize,
            padding: 12,
            overflowX: "auto",
            wordBreak: "break-all",
            whiteSpace: "pre-wrap",
            marginTop: 8,
            position: "relative",
            boxSizing: "border-box",
          }}
        >
          {/* 복사 버튼: 포맷 결과가 있을 때만 우측 상단에 표시 */}
          {showResult && output && (
            <button
              onClick={async () => {
                await copyToClipboard(output);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              style={{
                position: "absolute",
                top: 10,
                right: 16,
                zIndex: 2,
                padding: "4px 14px",
                fontSize: 14,
                background: copied ? "#4ade80" : "#374151",
                color: copied ? "#222" : "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 4px 0 rgba(0,0,0,0.10)",
                transition: "background 0.2s, color 0.2s",
              }}
              title="복사"
            >
              {copied ? "복사됨!" : "복사"}
            </button>
          )}
          {showResult && linesToShow}
          {/* 문법 하이라이트용 CSS */}
          <style>{`
            .json-key     { color: #7dd3fc; }
            .json-string  { color: #d291e4; }
            .json-number  { color: #7ec3fa; }
            .json-boolean { color: #facc15; }
            .json-null    { color: #facc15; }
          `}</style>
        </div>
      </div>
    </>
  );
}
