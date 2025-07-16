import React, { useState } from "react";
import { Helmet } from "react-helmet-async";

interface VideoInfoResult {
  channelName: string;
  videoTitle: string;
  videoCategory: string;
  videoCategoryValue: string;
}

interface VideoFrameUrl {
  quality: string;
  url: string;
}

interface VideoSummary {
  videoNo: number;
  videoTitle: string;
  thumbnailImageUrl: string;
  duration: number;
  publishDate: string;
}

interface ChzzkVideoProxyResponse {
  videoInfo: VideoInfoResult;
  frameUrls: VideoFrameUrl[];
  prevVideo?: VideoSummary;
  nextVideo?: VideoSummary;
}

function extractVideoNo(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

async function fetchChzzkVideo(
  videoNo: string
): Promise<ChzzkVideoProxyResponse> {
  const res = await fetch(`http://localhost:3100/chzzk/videos/${videoNo}`);
  if (!res.ok) throw new Error("동영상 정보를 불러오지 못했습니다.");
  return await res.json();
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ChzzkReplay() {
  const [input, setInput] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfoResult | null>(null);
  const [frameUrls, setFrameUrls] = useState<VideoFrameUrl[]>([]);
  const [prevVideo, setPrevVideo] = useState<VideoSummary | null>(null);
  const [nextVideo, setNextVideo] = useState<VideoSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVideoInfo(null);
    setFrameUrls([]);
    setPrevVideo(null);
    setNextVideo(null);
    setLoading(true);
    try {
      const videoNo = extractVideoNo(input);
      if (!videoNo)
        throw new Error("유효한 치지직 다시보기 주소를 입력하세요.");
      const data = await fetchChzzkVideo(videoNo);
      setVideoInfo(data.videoInfo);
      setFrameUrls(data.frameUrls);
      setPrevVideo(data.prevVideo || null);
      setNextVideo(data.nextVideo || null);
    } catch (e: any) {
      setError(e.message || "알 수 없는 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  const handleVideoClick = (videoNo: number) => {
    const newUrl = `https://chzzk.naver.com/video/${videoNo}`;
    setInput(newUrl);
    // 자동으로 새로운 동영상 정보를 가져오기 위해 폼 제출
    setTimeout(() => {
      const form = document.querySelector("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true }));
      }
    }, 100);
  };

  // 가장 높은 화질(첫 번째)을 미리보기로 사용
  const previewUrl = frameUrls.length > 0 ? frameUrls[0].url : null;

  return (
    <>
      <Helmet>
        <title>치지직 다시보기 - 툴박스</title>
        <meta
          name="description"
          content="치지직 방송 다시보기를 쉽고 빠르게 검색하고 시청할 수 있는 툴입니다."
        />
      </Helmet>
      <div
        style={{
          maxWidth: 480,
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
          치지직 다시보기 다운로드
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{ width: "100%", marginBottom: 24, display: "flex", gap: 8 }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="치지직 다시보기 주소 (예: https://chzzk.naver.com/video/{videoNo})"
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
            type="submit"
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
            추출
          </button>
        </form>
        {loading && (
          <div style={{ color: "#e5e7eb", marginBottom: 16, fontWeight: 500 }}>
            동영상 정보를 불러오는 중...
          </div>
        )}
        {error && (
          <div style={{ color: "#ff4f4f", marginBottom: 16 }}>{error}</div>
        )}
        {videoInfo && (
          <div style={{ width: "100%", marginBottom: 24 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 18,
                marginBottom: 8,
                color: "#fff",
              }}
            >
              {videoInfo.videoTitle}
            </div>
            <div style={{ color: "#f3f4f6", fontWeight: 500, marginBottom: 4 }}>
              {videoInfo.channelName}
            </div>
            <div style={{ color: "#e5e7eb", fontSize: 14 }}>
              {videoInfo.videoCategoryValue} ({videoInfo.videoCategory})
            </div>
          </div>
        )}
        {previewUrl && (
          <div
            style={{
              width: "100%",
              marginBottom: 24,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 2px 8px 0 rgba(229,231,235,0.10)",
            }}
          >
            <video
              src={previewUrl}
              controls
              style={{ width: "100%", borderRadius: 12, background: "#000" }}
              poster={videoInfo ? undefined : undefined}
            />
          </div>
        )}
        {frameUrls.length > 0 && (
          <div style={{ width: "100%" }}>
            <h4
              style={{
                fontWeight: 600,
                fontSize: 16,
                marginBottom: 12,
                color: "#e5e7eb",
              }}
            >
              다운로드
            </h4>
            <div style={{ display: "flex", flexDirection: "row", gap: 16 }}>
              {frameUrls.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "14px 28px",
                    background: "#23272b",
                    color: "#e5e7eb",
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 17,
                    textDecoration: "none",
                    border: "2px solid #333",
                    boxShadow: "0 2px 8px 0 rgba(229,231,235,0.10)",
                    transition:
                      "background 0.2s, box-shadow 0.2s, border 0.2s, color 0.2s",
                    cursor: "pointer",
                    letterSpacing: 1,
                    minWidth: 90,
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#181c1f";
                    e.currentTarget.style.border = "2px solid #e5e7eb";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px 0 rgba(0,0,0,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#23272b";
                    e.currentTarget.style.border = "2px solid #333";
                    e.currentTarget.style.color = "#e5e7eb";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px 0 rgba(229,231,235,0.10)";
                  }}
                >
                  {item.quality}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 앞뒤 동영상 정보 표시 */}
        {(prevVideo || nextVideo) && (
          <div style={{ width: "100%", marginTop: 24 }}>
            <h4
              style={{
                fontWeight: 600,
                fontSize: 16,
                marginBottom: 16,
                color: "#e5e7eb",
              }}
            >
              관련 동영상
            </h4>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {prevVideo && (
                <div
                  onClick={() => handleVideoClick(prevVideo.videoNo)}
                  style={{
                    flex: 1,
                    minWidth: 200,
                    background: "#181c1f",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px 0 rgba(0,0,0,0.15)",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px 0 rgba(0,0,0,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px 0 rgba(0,0,0,0.15)";
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      src={prevVideo.thumbnailImageUrl}
                      alt={prevVideo.videoTitle}
                      style={{
                        width: "100%",
                        height: 120,
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        background: "rgba(59, 130, 246, 0.9)",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      이전 동영상
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        background: "rgba(0,0,0,0.8)",
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {formatDuration(prevVideo.duration)}
                    </div>
                  </div>
                  <div style={{ padding: 12 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#fff",
                        marginBottom: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {prevVideo.videoTitle}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#e5e7eb",
                      }}
                    >
                      {formatDate(prevVideo.publishDate)}
                    </div>
                  </div>
                </div>
              )}
              {nextVideo && (
                <div
                  onClick={() => handleVideoClick(nextVideo.videoNo)}
                  style={{
                    flex: 1,
                    minWidth: 200,
                    background: "#181c1f",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px 0 rgba(0,0,0,0.15)",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px 0 rgba(0,0,0,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px 0 rgba(0,0,0,0.15)";
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      src={nextVideo.thumbnailImageUrl}
                      alt={nextVideo.videoTitle}
                      style={{
                        width: "100%",
                        height: 120,
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        background: "rgba(34, 197, 94, 0.9)",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      다음 동영상
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        background: "rgba(0,0,0,0.8)",
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {formatDuration(nextVideo.duration)}
                    </div>
                  </div>
                  <div style={{ padding: 12 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#fff",
                        marginBottom: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {nextVideo.videoTitle}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#e5e7eb",
                      }}
                    >
                      {formatDate(nextVideo.publishDate)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
