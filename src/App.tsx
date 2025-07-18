import React, { useState } from "react";
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

  // 현재 경로에서 상단/좌측 탭 활성화 결정
  let activeTopTab = "다시보기";
  let activeSideTab = "치지직";
  if (location.pathname.startsWith("/replay")) {
    activeTopTab = "다시보기";
    if (location.pathname === "/replay/youtube") activeSideTab = "유튜브";
    else if (location.pathname === "/replay/soop") activeSideTab = "숲";
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
        minHeight: "100vh",
        background: "#181c1f",
        display: "flex",
        justifyContent: "center",
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
      <div style={{ flex: 1 }}>
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
        <div
          className="main-content"
          style={{
            marginLeft:
              activeTopTab === "다시보기" ||
              activeTopTab === "개발" ||
              activeTopTab === "여행"
                ? 120
                : 0,
            paddingTop: 64,
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <Routes>
            <Route path="/replay/chzzk" element={<ChzzkReplay />} />
            <Route path="/replay/youtube" element={<YoutubeReplay />} />
            <Route path="/replay/soop" element={<SoopReplay />} />
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
                <div
                  style={{ color: "#fff", padding: 40, textAlign: "center" }}
                >
                  페이지를 찾을 수 없습니다.
                </div>
              }
            />
          </Routes>
          <footer
            style={{
              textAlign: "center",
              color: "#f3f4f6",
              fontSize: 14,
              marginTop: 40,
              paddingBottom: 24,
              textShadow: "0 0 6px #fff",
            }}
          >
            © {new Date().getFullYear()} 툴박스
          </footer>
        </div>
      </div>
      {/* 우측 광고 영역 */}
      <div
        className="ad-fixed"
        style={{
          width: 320,
          minWidth: 300,
          marginLeft: 24,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          position: "sticky",
          top: 80,
          height: "100vh",
        }}
      >
        <GoogleAd />
      </div>
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
