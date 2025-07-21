import React, { useState, useRef, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import Topbar from "./components/Topbar.tsx";
import Sidebar from "./components/Sidebar.tsx";
import ChzzkReplay from "./features/video/ChzzkReplay.tsx";
import YoutubeReplay from "./features/video/YoutubeReplay.tsx";
import SoopReplay from "./features/video/SoopReplay.tsx";
import JsonFormat from "./features/dev/JsonFormat.tsx";
import AgodaLowest from "./features/travel/AgodaLowest.tsx";
import { HelmetProvider } from "react-helmet-async";
import GoogleAd from "./components/GoogleAd.tsx";
import HashGenerator from "./features/dev/HashGenerator.tsx";
import JwtDecode from "./features/dev/JwtDecode.tsx";
import VideoEditor from "./features/video/VideoEditor.tsx";

// 탭/경로 매핑
const topTabs = [
  { label: "다시보기", path: "/replay" },
  { label: "개발", path: "/dev" },
  { label: "여행", path: "/travel" },
  { label: "해시 생성", path: "/dev/hash-generator" },
];
const sideTabs = {
  replay: [
    { label: "치지직", path: "/replay/chzzk" },
    { label: "유튜브", path: "/replay/youtube" },
    { label: "숲", path: "/replay/soop" },
    { label: "영상 자르기", path: "/replay/video-edit" },
  ],
  dev: [
    { label: "JSON format", path: "/dev/json-format" },
    { label: "해시 생성", path: "/dev/hash-generator" },
    { label: "JWT 복호화", path: "/dev/jwt-decode" },
  ],
  travel: [{ label: "아고다", path: "/travel/agoda" }],
};

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [adLeft, setAdLeft] = useState<number | null>(null);

  useEffect(() => {
    function updateAdLeft() {
      if (mainContentRef.current) {
        const rect = mainContentRef.current.getBoundingClientRect();
        setAdLeft(rect.right + 100);
      }
    }
    updateAdLeft();
    window.addEventListener("resize", updateAdLeft);
    return () => window.removeEventListener("resize", updateAdLeft);
  }, []);

  // 현재 경로에서 상단/좌측 탭 활성화 결정
  let activeTopTab = "다시보기";
  let activeSideTab = "치지직";
  if (location.pathname.startsWith("/replay")) {
    activeTopTab = "다시보기";
    if (location.pathname === "/replay/youtube") activeSideTab = "유튜브";
    else if (location.pathname === "/replay/soop") activeSideTab = "숲";
    else if (location.pathname === "/replay/video-edit")
      activeSideTab = "영상 자르기";
    else activeSideTab = "치지직";
  } else if (location.pathname.startsWith("/dev")) {
    activeTopTab = "개발";
    if (location.pathname === "/dev/json-format") activeSideTab = "JSON format";
    else if (location.pathname === "/dev/hash-generator")
      activeSideTab = "해시 생성";
    else if (location.pathname === "/dev/jwt-decode")
      activeSideTab = "JWT 복호화";
  } else if (location.pathname.startsWith("/travel")) {
    activeTopTab = "여행";
    activeSideTab = "아고다";
  }

  // 탭 클릭 시 경로 이동
  const handleTopTabChange = (tab: string) => {
    const found = topTabs.find((t) => t.label === tab);
    if (found) {
      // 상단탭 변경 시, 해당 탭의 첫 번째 사이드탭으로 이동
      if (tab === "다시보기") navigate("/replay/chzzk");
      else if (tab === "개발") navigate("/dev/json-format");
      else if (tab === "여행") navigate("/travel/agoda");
    }
  };
  const handleSideTabChange = (tab: string) => {
    if (activeTopTab === "다시보기") {
      if (tab === "치지직") navigate("/replay/chzzk");
      else if (tab === "유튜브") navigate("/replay/youtube");
      else if (tab === "숲") navigate("/replay/soop");
      else if (tab === "영상 자르기") navigate("/replay/video-edit");
    } else if (activeTopTab === "개발") {
      if (tab === "JSON format") navigate("/dev/json-format");
      else if (tab === "해시 생성") navigate("/dev/hash-generator");
      else if (tab === "JWT 복호화") navigate("/dev/jwt-decode");
    } else if (activeTopTab === "여행") {
      navigate("/travel/agoda");
    }
  };

  // 사이드탭 목록 결정
  let sideTabList = sideTabs.replay;
  if (activeTopTab === "개발") sideTabList = sideTabs.dev;
  if (activeTopTab === "여행") sideTabList = sideTabs.travel;

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#181c1f",
      }}
    >
      {/* 모바일 오버레이 사이드바 */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            top: window.innerWidth <= 600 ? 48 : 64,
            left: 0,
            width: "100vw",
            height: `calc(200vh - ${window.innerWidth <= 600 ? 48 : 64}px)`,
            background: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
          }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 220,
              height: "100%",
              background: "#23272b",
              boxShadow: "2px 0 16px 0 rgba(0,0,0,0.25)",
              zIndex: 101,
              transition: "transform 0.2s",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              activeTab={activeSideTab}
              onTabChange={(tab) => {
                handleSideTabChange(tab);
                setSidebarOpen(false);
              }}
              topTab={activeTopTab}
              tabs={sideTabList}
              isOverlay={true}
            />
          </div>
        </div>
      )}
      {/* 메인 컨텐츠 */}
      <div
        className="main-content"
        ref={mainContentRef}
        style={{
          maxWidth: 900,
          width: "100%",
          margin: "0 auto",
          marginLeft: 120, // 사이드바로부터 120px 떨어진 위치에 오도록
          paddingTop: 64,
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Topbar
          activeTopTab={activeTopTab}
          onTopTabChange={handleTopTabChange}
          onMenuClick={() => setSidebarOpen(true)}
        />
        {/* PC/태블릿 사이드바 */}
        <Sidebar
          activeTab={activeSideTab}
          onTabChange={handleSideTabChange}
          topTab={activeTopTab}
          tabs={sideTabList}
        />
        <Routes>
          <Route path="/replay/chzzk" element={<ChzzkReplay />} />
          <Route path="/replay/youtube" element={<YoutubeReplay />} />
          <Route path="/replay/soop" element={<SoopReplay />} />
          <Route path="/replay/video-edit" element={<VideoEditor />} />
          <Route path="/dev/json-format" element={<JsonFormat />} />
          <Route path="/travel/agoda" element={<AgodaLowest />} />
          <Route path="/dev/hash-generator" element={<HashGenerator />} />
          <Route path="/dev/jwt-decode" element={<JwtDecode />} />
          {/* 기본 경로 리다이렉트 */}
          <Route path="/" element={<Navigate to="/replay/chzzk" replace />} />
          {/* 404 */}
          <Route
            path="*"
            element={
              <div style={{ color: "#fff", padding: 40, textAlign: "center" }}>
                페이지를 찾을 수 없습니다.
              </div>
            }
          />
        </Routes>
      </div>
      {/* 광고 영역: 1200px 이상에서만 표시, 서비스 영역 오른쪽에서 100px 떨어진 위치에 고정 */}
      {typeof window !== "undefined" &&
        window.innerWidth > 1200 &&
        adLeft !== null && (
          <div
            className="ad-fixed"
            style={{
              width: 320,
              minWidth: 300,
              position: "fixed",
              left: adLeft,
              top: 80,
              height: "600px",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              zIndex: 100,
            }}
          >
            <GoogleAd />
          </div>
        )}
      <footer
        style={{
          position: "fixed",
          left: 0,
          bottom: 0,
          width: "100vw",
          textAlign: "center",
          color: "#f3f4f6",
          fontSize: 14,
          padding: "16px 0 12px 0",
          background: "transparent",
          zIndex: 100,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        © {new Date().getFullYear()} 툴박스
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </HelmetProvider>
  );
}
