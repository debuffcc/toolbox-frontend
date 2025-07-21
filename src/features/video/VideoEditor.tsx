import React, { useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import "rc-slider/assets/index.css";
import { Helmet } from "react-helmet-async";

function fetchFile(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

interface Clip {
  start: number;
  end: number;
}

export default function VideoEditor() {
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [, setRange] = useState<[number, number]>([0, 0]);
  const [, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [, setThumbnails] = useState<string[]>([]); // 썸네일 이미지 URL 배열
  const [, setCurrentTime] = useState(0); // 현재 재생 위치
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpeg = useRef<any>(null);
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [autoAdd, setAutoAdd] = useState(true);

  React.useEffect(() => {
    ffmpeg.current = new FFmpeg();
    ffmpeg.current.load().then(() => setReady(true));
  }, []);

  // 썸네일 추출 함수
  const extractThumbnails = async (videoFile: File, duration: number) => {
    const videoEl = document.createElement("video");
    videoEl.src = URL.createObjectURL(videoFile);
    videoEl.crossOrigin = "anonymous";
    await new Promise((resolve) => {
      videoEl.onloadedmetadata = resolve;
    });
    const interval = Math.max(1, Math.floor(duration / 10)); // 10개 이하로 제한
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 90;
    const urls: string[] = [];
    for (let t = 0; t < duration; t += interval) {
      videoEl.currentTime = t;
      await new Promise((res) => {
        videoEl.onseeked = () => res(null);
      });
      canvas
        .getContext("2d")
        ?.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      urls.push(canvas.toDataURL("image/jpeg"));
    }
    // 마지막 프레임
    videoEl.currentTime = duration - 0.1;
    await new Promise((res) => {
      videoEl.onseeked = () => res(null);
    });
    canvas
      .getContext("2d")
      ?.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    urls.push(canvas.toDataURL("image/jpeg"));
    setThumbnails(urls);
    URL.revokeObjectURL(videoEl.src);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOutputUrl(null);
    setError("");
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0]);
      setClips([]);
      setRange([0, 0]);
      setDuration(0);
      setThumbnails([]);
    }
  };

  const handleLoadedMetadata = async (
    e: React.SyntheticEvent<HTMLVideoElement>
  ) => {
    const dur = e.currentTarget.duration;
    if (!dur || isNaN(dur) || dur === Infinity) {
      setError("영상을 불러올 수 없습니다. 다른 파일을 시도해보세요.");
      setDuration(0);
      setRange([0, 0]);
      setThumbnails([]);
      return;
    }
    setDuration(dur);
    setRange([0, Math.floor(dur)]);
    if (video) await extractThumbnails(video, dur);
  };

  const handleAddClip = (customStart?: number, customEnd?: number) => {
    const s = customStart !== undefined ? customStart : Number(start);
    const e = customEnd !== undefined ? customEnd : Number(end);
    if (!s || !e || isNaN(s) || isNaN(e) || s >= e) {
      setError("올바른 시작/끝 시간을 입력하세요.");
      return;
    }
    setClips([...clips, { start: s, end: e }]);
    setError("");
  };

  const handleRemoveClip = (idx: number) => {
    setClips(clips.filter((_, i) => i !== idx));
  };

  const handleCut = async () => {
    if (!video || clips.length === 0) return;
    setProcessing(true);
    setError("");
    setOutputUrl(null);
    try {
      await ffmpeg.current.writeFile("input.mp4", await fetchFile(video));
      const partFiles: string[] = [];
      for (let i = 0; i < clips.length; i++) {
        const { start, end } = clips[i];
        const outName = `part${i}.mp4`;
        await ffmpeg.current.exec([
          "-i",
          "input.mp4",
          "-ss",
          start.toString(),
          "-to",
          end.toString(),
          "-c",
          "copy",
          outName,
        ]);
        partFiles.push(outName);
      }
      const concatList = partFiles.map((f) => `file '${f}'`).join("\n");
      await ffmpeg.current.writeFile(
        "concat.txt",
        new TextEncoder().encode(concatList)
      );
      await ffmpeg.current.exec([
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "concat.txt",
        "-c",
        "copy",
        "output.mp4",
      ]);
      const data = await ffmpeg.current.readFile("output.mp4");
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
      setOutputUrl(url);
    } catch (e: any) {
      setError("영상 편집 중 오류가 발생했습니다.");
    }
    setProcessing(false);
  };

  function formatTime(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const videoUrl = React.useMemo(() => {
    if (!video) return "";
    return URL.createObjectURL(video);
  }, [video]);

  React.useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  // 구간 시작/끝을 영상의 현재 재생 위치로 지정하는 함수
  const setStartToCurrent = () => {
    if (videoRef.current) {
      const t = Math.floor(videoRef.current.currentTime);
      setStart(t.toString());
      setRange([t, Number(end) || t]);
    }
  };
  // setEndToCurrent에서 autoAdd가 true일 때만 자동 추가
  const setEndToCurrent = () => {
    if (videoRef.current) {
      const t = Math.floor(videoRef.current.currentTime);
      setEnd(t.toString());
      setRange([Number(start) || 0, t]);
      if (autoAdd && start && !isNaN(Number(start)) && Number(start) < t) {
        handleAddClip(Number(start), t);
      }
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "j" || e.key === "J") {
        setStartToCurrent();
      } else if (e.key === "k" || e.key === "K") {
        setEndToCurrent();
      } else if (e.key === "a" || e.key === "A") {
        handleAddClip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div
      style={{
        width: "100%",
        marginLeft: 120,
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      <Helmet>
        <title>영상 자르기, 구간 편집 - 툴박스</title>
        <meta
          name="description"
          content="여러 구간을 선택해 영상 자르기, 합치기, 편집 등 다양한 영상 툴을 제공합니다."
        />
      </Helmet>
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
          width: "100%",
          position: "relative",
        }}
      >
        {/* 우측 상단 ? 아이콘 및 툴팁 */}
        <div style={{ position: "absolute", top: 24, right: 24, zIndex: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#333",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 22,
              cursor: "pointer",
              boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            ?
          </div>
          {showTooltip && (
            <div
              style={{
                position: "absolute",
                top: 40,
                right: 0,
                background: "#23272b",
                color: "#fff",
                borderRadius: 8,
                boxShadow: "0 2px 12px 0 rgba(0,0,0,0.18)",
                padding: 18,
                fontSize: 15,
                width: 320,
                zIndex: 20,
                whiteSpace: "pre-line",
                border: "1px solid #444",
              }}
            >
              {`
영상 자르기 사용법

- 파일 선택 후 영상을 재생/탐색하며 원하는 구간을 지정하세요.
- [J] : 현재 위치를 구간 시작으로 지정
- [K] : 현재 위치를 구간 끝으로 지정
- [A] : 구간 추가

- 여러 구간을 추가한 뒤 "구간 합치기"를 누르면, 모든 구간이 하나의 영상으로 합쳐집니다.
- 구간 리스트에서 삭제도 가능합니다.

- "구간 자동 추가 ON" 상태에서 구간 끝을 누르면, 구간이 자동으로 추가됩니다.
              `}
            </div>
          )}
        </div>
        <h2
          style={{
            fontWeight: 700,
            fontSize: 26,
            marginBottom: 24,
            color: "#e5e7eb",
          }}
        >
          영상 자르기 (mp4)
        </h2>
        {/* 파일 선택 영역 개선 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <label
            htmlFor="video-upload"
            style={{
              padding: "8px 18px",
              background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)",
              color: "#181c1f",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 2px 8px 0 rgba(243,244,246,0.12)",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>📁</span> 파일 선택
          </label>
          <input
            id="video-upload"
            type="file"
            accept="video/mp4"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          {video && (
            <span
              style={{
                background: "#181c1f",
                color: "#e5e7eb",
                padding: "7px 16px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 15,
                border: "1px solid #333",
                maxWidth: 320,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {video.name}
            </span>
          )}
        </div>
        {video && (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              style={{
                width: "100%",
                maxHeight: 320,
                marginBottom: 16,
                background: "#000",
                borderRadius: 12,
              }}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={() =>
                setCurrentTime(videoRef.current?.currentTime || 0)
              }
              onSeeked={() =>
                setCurrentTime(videoRef.current?.currentTime || 0)
              }
              onPlay={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              onPause={() => setCurrentTime(videoRef.current?.currentTime || 0)}
            />
            {/* 현재 선택된 구간 표시 */}
            <div
              style={{
                color: "#e5e7eb",
                fontWeight: 500,
                marginBottom: 8,
                fontSize: 16,
              }}
            >
              현재 구간: {formatTime(Number(start))} ~ {formatTime(Number(end))}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 12,
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setAutoAdd((v) => !v)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: autoAdd ? "2px solid #60a5fa" : "2px solid #aaa",
                  background: autoAdd ? "#e0f2fe" : "#23272b",
                  color: autoAdd ? "#181c1f" : "#e5e7eb",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  marginBottom: 8,
                }}
              >
                구간 자동 추가 {autoAdd ? "ON" : "OFF"}
              </button>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={setStartToCurrent}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#e5e7eb",
                    color: "#181c1f",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                  }}
                >
                  구간 시작(현재 위치) [J]
                </button>
                <button
                  onClick={setEndToCurrent}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#e5e7eb",
                    color: "#181c1f",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                  }}
                >
                  구간 끝(현재 위치) [K]
                </button>
              </div>
            </div>
          </>
        )}
        {clips.length > 0 && (
          <div style={{ width: "100%", marginBottom: 16 }}>
            <div style={{ color: "#e5e7eb", fontWeight: 600, marginBottom: 8 }}>
              선택된 구간
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {clips.map((clip, idx) => (
                <li
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{ color: "#fff", fontSize: 15, marginRight: 12 }}
                  >
                    {idx + 1}. {formatTime(clip.start)} ~ {formatTime(clip.end)}
                  </span>
                  <button
                    onClick={() => handleRemoveClip(idx)}
                    style={{
                      background: "#ff4f4f",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "2px 10px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 13,
                      marginLeft: 8,
                    }}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {video && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 16,
              justifyContent: "center",
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            <button
              onClick={() => handleAddClip()}
              disabled={!ready || processing || Number(end) - Number(start) < 1}
              style={{
                width: 180,
                padding: "10px 0",
                fontSize: 17,
                background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)",
                color: "#181c1f",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor:
                  ready && !processing && Number(end) - Number(start) >= 1
                    ? "pointer"
                    : "not-allowed",
                height: 44,
              }}
            >
              구간 추가 [A]
            </button>
            <button
              onClick={handleCut}
              disabled={!ready || processing || clips.length === 0}
              style={{
                width: 180,
                padding: "10px 0",
                fontSize: 17,
                background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)",
                color: "#181c1f",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor:
                  ready && !processing && clips.length > 0
                    ? "pointer"
                    : "not-allowed",
                height: 44,
              }}
            >
              구간 합치기
            </button>
          </div>
        )}
        {processing && (
          <div style={{ color: "#e5e7eb", marginBottom: 16 }}>
            영상 처리 중...
          </div>
        )}
        {error && (
          <div style={{ color: "#ff4f4f", marginBottom: 16 }}>{error}</div>
        )}
        {outputUrl && (
          <div style={{ width: "100%", marginTop: 16, textAlign: "center" }}>
            <video
              src={outputUrl}
              controls
              style={{
                width: "100%",
                maxHeight: 320,
                background: "#000",
                borderRadius: 12,
                marginBottom: 12,
              }}
            />
            <a
              href={outputUrl}
              download="output.mp4"
              style={{
                display: "inline-block",
                padding: "10px 28px",
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
              }}
            >
              다운로드
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
