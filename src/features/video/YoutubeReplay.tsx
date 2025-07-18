import React, { useState } from "react";
import { Helmet } from "react-helmet-async";

export default function YoutubeReplay() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const isValidYoutubeUrl = (url: string) => {
    return /^https?:\/\/(www\.)?youtube\.com\/watch\?v=\w+/.test(url);
  };

  const handleDownload = () => {
    if (!isValidYoutubeUrl(input)) {
      setError("유효한 유튜브 동영상 주소를 입력하세요.");
      return;
    }
    setError("");
    const ytUrl = encodeURIComponent(input);
    window.open(
      `https://www.ssyoutube.com/watch?v=${ytUrl}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <Helmet>
        <title>유튜브 다시보기 - 툴박스</title>
        <meta
          name="description"
          content="유튜브 방송 다시보기를 쉽고 빠르게 검색하고 시청할 수 있는 툴입니다."
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
              fontSize: 26,
              marginBottom: 24,
              color: "#e5e7eb",
            }}
          >
            유튜브 다시보기 다운로드
          </h2>
          <div
            style={{ width: "100%", marginBottom: 24, display: "flex", gap: 8 }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="유튜브 동영상 주소 (예: https://www.youtube.com/watch?v=xxxx)"
              style={{
                flex: 1,
                padding: 12,
                fontSize: 16,
                border: "1px solid #333",
                borderRadius: 8,
                outline: "none",
                background: "#181c1f",
                color: "#fff",
              }}
            />
            <button
              onClick={handleDownload}
              style={{
                padding: "0 24px",
                fontSize: 16,
                background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)",
                color: "#181c1f",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
                height: 44,
                boxShadow: "0 2px 8px 0 rgba(243,244,246,0.12)",
              }}
            >
              다운로드
            </button>
          </div>
          {error && (
            <div style={{ color: "#ff4f4f", marginBottom: 16 }}>{error}</div>
          )}
        </div>
      </div>
    </>
  );
}
