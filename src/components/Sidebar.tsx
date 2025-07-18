import React from "react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  topTab: string;
  tabs: { label: string; path: string }[];
  isOverlay?: boolean;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  topTab,
  tabs,
  isOverlay = false,
}: SidebarProps) {
  return (
    <aside
      className={isOverlay ? "sidebar-overlay" : "sidebar-fixed"}
      style={{
        width: isOverlay ? "100%" : 120,
        background: "#23272b",
        height: "100vh",
        paddingTop: isOverlay ? 0 : 64,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        boxShadow: "2px 0 8px 0 rgba(0,0,0,0.10)",
        position: isOverlay ? "static" : "fixed",
        left: 0,
        top: 0,
        zIndex: 10,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.label}
          onClick={() => onTabChange(tab.label)}
          style={{
            background: activeTab === tab.label ? "#181c1f" : "none",
            color: activeTab === tab.label ? "#fff" : "#e5e7eb",
            border: "none",
            borderLeft:
              activeTab === tab.label
                ? "4px solid #e5e7eb"
                : "4px solid transparent",
            fontWeight: 700,
            fontSize: 18,
            padding: "18px 0 18px 20px",
            textAlign: "left",
            cursor: "pointer",
            outline: "none",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          {tab.label}
        </button>
      ))}
    </aside>
  );
}
