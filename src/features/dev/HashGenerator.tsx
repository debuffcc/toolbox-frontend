import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { md5 } from "js-md5";

const algorithms = ["SHA-256", "SHA-1", "MD5"];
const algoMap: Record<string, string> = {
  "SHA-256": "SHA-256",
  "SHA-1": "SHA-1",
  MD5: "MD5",
};

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [key, setKey] = useState("");
  const [algorithm, setAlgorithm] = useState("SHA-256");
  const [useHmac, setUseHmac] = useState(false);
  const [perLine, setPerLine] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    let lines = perLine ? input.split("\n") : [input];
    let results: string[] = [];
    for (const line of lines) {
      if (useHmac && key) {
        const hash = await calcHmac(line, key, algorithm);
        results.push(hash);
      } else {
        const hash = await calcHash(line, algorithm);
        results.push(hash);
      }
    }
    setResult(results.join("\n"));
  }

  async function calcHash(text: string, algo: string) {
    if (algo === "MD5") {
      return md5(text);
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const algoName = algoMap[algo] || algo;
    let hashBuffer = await window.crypto.subtle.digest(algoName, data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function calcHmac(text: string, key: string, algo: string) {
    if (algo === "MD5") {
      // HMAC-MD5는 js-md5에서 지원하므로 사용
      return md5.hmac(key, text);
    }
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const algoName = algoMap[algo] || algo;
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: { name: algoName } },
      false,
      ["sign"]
    );
    const sig = await window.crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(text)
    );
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // 클립보드 복사
  function copyToClipboard(text: string) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return Promise.resolve();
    }
  }

  return (
    <>
      <Helmet>
        <title>해시 생성기 - 툴박스</title>
        <meta
          name="description"
          content="SHA256, SHA512, MD5 등 다양한 해시값을 빠르게 생성할 수 있는 툴입니다."
        />
      </Helmet>
      <div style={{ width: "100%", marginLeft: 120 }}>
        <div
          style={{
            maxWidth: 900,
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
            해시 생성기
          </h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="입력값"
            style={{
              width: "100%",
              minHeight: 100,
              fontSize: 15,
              border: "1px solid #333",
              borderRadius: 8,
              background: "#181c1f",
              color: "#fff",
              marginBottom: 12,
              padding: 12,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="HMAC 키 (옵션)"
            style={{
              width: "100%",
              fontSize: 15,
              border: "1px solid #333",
              borderRadius: 8,
              background: useHmac ? "#181c1f" : "#23272b",
              color: useHmac ? "#fff" : "#888",
              marginBottom: 12,
              padding: 10,
              boxSizing: "border-box",
            }}
            disabled={!useHmac}
          />
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            style={{
              width: "100%",
              fontSize: 15,
              border: "1px solid #333",
              borderRadius: 8,
              background: "#181c1f",
              color: "#fff",
              marginBottom: 12,
              padding: 10,
              boxSizing: "border-box",
            }}
          >
            {algorithms.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <div
            style={{
              width: "100%",
              display: "flex",
              gap: 16,
              marginBottom: 12,
            }}
          >
            <label style={{ color: "#e5e7eb", fontSize: 15 }}>
              <input
                type="checkbox"
                checked={useHmac}
                onChange={(e) => setUseHmac(e.target.checked)}
                style={{ marginRight: 6 }}
              />{" "}
              HMAC 사용
            </label>
            <label style={{ color: "#e5e7eb", fontSize: 15 }}>
              <input
                type="checkbox"
                checked={perLine}
                onChange={(e) => setPerLine(e.target.checked)}
                style={{ marginRight: 6 }}
              />{" "}
              라인별 해시 생성
            </label>
          </div>
          <button
            onClick={handleGenerate}
            style={{
              width: "100%",
              padding: "12px 0",
              fontSize: 17,
              background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)",
              color: "#181c1f",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px 0 rgba(243,244,246,0.12)",
              marginBottom: 16,
            }}
          >
            생성하기
          </button>
          <div
            style={{
              width: "100%",
              minHeight: 100,
              background: "#181c1f",
              color: "#e5e7eb",
              borderRadius: 8,
              border: "1px solid #333",
              fontSize: 15,
              padding: 12,
              overflowX: "auto",
              wordBreak: "break-all",
              whiteSpace: "pre-wrap",
              marginTop: 8,
              position: "relative",
              boxSizing: "border-box",
            }}
          >
            {/* 복사 버튼: 결과가 있을 때만 우측 상단에 표시 */}
            {result && (
              <button
                onClick={async () => {
                  await copyToClipboard(result);
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
            {result}
          </div>
        </div>
      </div>
    </>
  );
}
