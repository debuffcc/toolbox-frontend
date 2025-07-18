import React, { useState } from "react";
import { Helmet } from "react-helmet-async";

function base64UrlDecode(str: string) {
  try {
    // base64url -> base64
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    // pad
    while (str.length % 4) str += "=";
    return decodeURIComponent(
      atob(str)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  } catch {
    return "";
  }
}

function parseJwt(token: string) {
  const [header, payload, signature] = token.split(".");
  return {
    header: header ? base64UrlDecode(header) : "",
    payload: payload ? base64UrlDecode(payload) : "",
    signature: signature || "",
  };
}

export default function JwtDecode() {
  const [jwt, setJwt] = useState("");
  const [secret, setSecret] = useState("");
  const [header, setHeader] = useState("");
  const [payload, setPayload] = useState("");
  const [signature, setSignature] = useState("");
  const [valid, setValid] = useState<null | boolean>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function handleDecode() {
    const { header, payload, signature } = parseJwt(jwt.trim());
    setHeader(header);
    setPayload(payload);
    setSignature(signature);
    setValid(null);
  }

  async function handleVerify() {
    try {
      const { header, signature } = parseJwt(jwt.trim());
      const headerObj = JSON.parse(header);
      let algo = headerObj.alg;
      if (algo === "HS256") {
        // HMAC SHA-256
        const enc = new TextEncoder();
        const key = await window.crypto.subtle.importKey(
          "raw",
          enc.encode(secret),
          { name: "HMAC", hash: { name: "SHA-256" } },
          false,
          ["sign"]
        );
        const data = enc.encode(jwt.trim().split(".").slice(0, 2).join("."));
        const sig = await window.crypto.subtle.sign("HMAC", key, data);
        const sigArr = Array.from(new Uint8Array(sig));
        const sigB64 = btoa(String.fromCharCode(...sigArr))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        setValid(sigB64 === signature);
      } else {
        setValid(false);
      }
    } catch {
      setValid(false);
    }
  }

  function handleCopy(text: string, type: string) {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <>
      <Helmet>
        <title>JWT 복호화 - 툴박스</title>
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
            JWT 복호화
          </h2>
          <textarea
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
            placeholder="JWT를 입력하세요"
            style={{
              width: "100%",
              minHeight: 60,
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
          <div
            style={{
              width: "100%",
              display: "flex",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <button
              onClick={handleDecode}
              style={{
                flex: 1,
                padding: "10px 0",
                fontSize: 16,
                background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)",
                color: "#181c1f",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px 0 rgba(243,244,246,0.12)",
              }}
            >
              디코드
            </button>
          </div>
          <div style={{ width: "100%", display: "flex", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{ color: "#e5e7eb", fontWeight: 600, marginBottom: 6 }}
              >
                HEADER
              </div>
              <div style={{ position: "relative" }}>
                <pre
                  style={{
                    background: "#181c1f",
                    color: "#fff",
                    borderRadius: 8,
                    border: "1px solid #333",
                    padding: 12,
                    minHeight: 80,
                    fontSize: 15,
                    marginBottom: 8,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {header}
                </pre>
                <button
                  onClick={() => handleCopy(header, "header")}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 16,
                    zIndex: 2,
                    padding: "4px 14px",
                    fontSize: 14,
                    background: copied === "header" ? "#4ade80" : "#374151",
                    color: copied === "header" ? "#222" : "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 1px 4px 0 rgba(0,0,0,0.10)",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  title="복사"
                >
                  {copied === "header" ? "복사됨!" : "복사"}
                </button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{ color: "#e5e7eb", fontWeight: 600, marginBottom: 6 }}
              >
                PAYLOAD
              </div>
              <div style={{ position: "relative" }}>
                <pre
                  style={{
                    background: "#181c1f",
                    color: "#fff",
                    borderRadius: 8,
                    border: "1px solid #333",
                    padding: 12,
                    minHeight: 80,
                    fontSize: 15,
                    marginBottom: 8,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {payload}
                </pre>
                <button
                  onClick={() => handleCopy(payload, "payload")}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 16,
                    zIndex: 2,
                    padding: "4px 14px",
                    fontSize: 14,
                    background: copied === "payload" ? "#4ade80" : "#374151",
                    color: copied === "payload" ? "#222" : "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 1px 4px 0 rgba(0,0,0,0.10)",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  title="복사"
                >
                  {copied === "payload" ? "복사됨!" : "복사"}
                </button>
              </div>
            </div>
          </div>
          <div style={{ width: "100%", marginTop: 24 }}>
            <div style={{ color: "#e5e7eb", fontWeight: 600, marginBottom: 6 }}>
              SIGNATURE
            </div>
            <div style={{ position: "relative" }}>
              <pre
                style={{
                  background: "#181c1f",
                  color: "#fff",
                  borderRadius: 8,
                  border: "1px solid #333",
                  padding: 12,
                  minHeight: 40,
                  fontSize: 15,
                  marginBottom: 8,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {signature}
              </pre>
              <button
                onClick={() => handleCopy(signature, "signature")}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 16,
                  zIndex: 2,
                  padding: "4px 14px",
                  fontSize: 14,
                  background: copied === "signature" ? "#4ade80" : "#374151",
                  color: copied === "signature" ? "#222" : "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 4px 0 rgba(0,0,0,0.10)",
                  transition: "background 0.2s, color 0.2s",
                }}
                title="복사"
              >
                {copied === "signature" ? "복사됨!" : "복사"}
              </button>
            </div>
          </div>
          <div style={{ width: "100%", marginTop: 32 }}>
            <div style={{ color: "#e5e7eb", fontWeight: 600, marginBottom: 6 }}>
              JWT 시크릿 검증 (HS256)
            </div>
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="시크릿 키 입력 (선택)"
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
            />
            <button
              onClick={handleVerify}
              style={{
                width: "100%",
                padding: "10px 0",
                fontSize: 16,
                background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)",
                color: "#181c1f",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px 0 rgba(243,244,246,0.12)",
                marginBottom: 12,
              }}
            >
              시그니처 검증
            </button>
            {valid !== null && (
              <div
                style={{
                  color: valid ? "#4ade80" : "#ff4f4f",
                  fontWeight: 700,
                  fontSize: 16,
                  marginTop: 8,
                }}
              >
                {valid
                  ? "유효한 JWT (서명 일치)"
                  : "서명 불일치 또는 지원하지 않는 알고리즘"}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
