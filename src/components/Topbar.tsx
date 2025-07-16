import React from "react";

interface TopbarProps {
  activeTopTab: string;
  onTopTabChange: (tab: string) => void;
}

const topTabs = ["다시보기", "개발", "여행"];

export default function Topbar({ activeTopTab, onTopTabChange }: TopbarProps) {
  return (
    <nav
      style={{
        width: "100%",
        background: "#23272b",
        borderBottom: "1px solid #23272b",
        padding: "0 0 0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        boxShadow: "0 2px 8px 0 rgba(0,0,0,0.12)",
        fontWeight: 600,
        fontSize: 20,
        letterSpacing: 0.5,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 20,
      }}
    >
      <span
        style={{
          color: "#e5e7eb",
          fontWeight: 700,
          fontSize: 22,
          marginRight: 32,
        }}
      >
        툴박스
      </span>
      {topTabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTopTabChange(tab)}
          style={{
            background: "none",
            color: activeTopTab === tab ? "#e5e7eb" : "#a3a3a3",
            border: "none",
            borderBottom:
              activeTopTab === tab
                ? "2px solid #e5e7eb"
                : "2px solid transparent",
            fontWeight: 600,
            fontSize: 18,
            padding: "8px 16px",
            cursor: "pointer",
            outline: "none",
            transition: "color 0.2s, border-bottom 0.2s",
            marginRight: 16,
          }}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}
