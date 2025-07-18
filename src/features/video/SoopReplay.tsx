import React, { useState } from "react";
import { Helmet } from "react-helmet-async";

export default function SoopReplay() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const isValidSoopUrl = (url: string) => {
    return /^https?:\/\/(vod\.)?sooplive\.co\.kr\/player\/[0-9]+/.test(url);
  };

  const handleGo = () => {
    if (!isValidSoopUrl(input)) {
      setError("유효한 숲 다시보기 주소를 입력하세요.");
      return;
    }
    setError("");
    window.open(input, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Helmet>
        <title>숲 다시보기 - 툴박스</title>
        <meta
          name="description"
          content="숲 방송 다시보기를 쉽고 빠르게 검색하고 시청할 수 있는 툴입니다."
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
            숲 다시보기 다운로드 안내
          </h2>
          <div style={{ color: "#e5e7eb", fontSize: 15, marginBottom: 16 }}>
            <b>
              1.{" "}
              <a
                href="https://chromewebstore.google.com/detail/live-stream-downloader/looepbdllpjgdmkpdcdffhdbmpbcfekj"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#60a5fa" }}
              >
                HLS Downloader
              </a>{" "}
              크롬 확장 프로그램
            </b>
            을 설치하세요.
            <br />
            <b>
              2. 아래에 숲 다시보기 주소를 입력하고, 새 탭에서 열기를 누르세요.
            </b>
            <br />
            <b>
              3. 새 탭에서 영상이 재생되면 확장 프로그램으로 다운로드가
              가능합니다.
            </b>
          </div>
          <div
            style={{ width: "100%", marginBottom: 24, display: "flex", gap: 8 }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="숲 다시보기 주소 (예: https://vod.sooplive.co.kr/player/{number})"
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
              onClick={handleGo}
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
              새 탭에서 열기
            </button>
          </div>
          {error && (
            <div style={{ color: "#ff4f4f", marginBottom: 16 }}>{error}</div>
          )}
          <div style={{ color: "#e5e7eb", fontSize: 13, marginTop: 8 }}>
            <b>
              ※ 확장 프로그램이 자동으로 m3u8 스트림을 감지하여 다운로드 버튼을
              제공합니다.
            </b>
          </div>
        </div>
      </div>
    </>
  );
}
