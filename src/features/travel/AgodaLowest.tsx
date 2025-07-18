import React, { useState } from "react";
import { differenceInDays, parse } from "date-fns";
import { FaCalendarAlt } from "react-icons/fa";
import { Helmet } from "react-helmet-async";

interface AgodaResult {
  cid: number;
  label: string;
  price: number | null;
  hotelName: string | null;
  url: string;
  error?: boolean;
}

export default function AgodaLowest() {
  const [input, setInput] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState(1);
  const [children, setChildren] = useState(0);
  const [adults, setAdults] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<AgodaResult[]>([]);
  const [min, setMin] = useState<AgodaResult | null>(null);

  // 날짜 유효성 검사
  const isValidDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

  // 숙박일수 계산
  let los = 1;
  if (isValidDate(checkIn) && isValidDate(checkOut)) {
    try {
      los = differenceInDays(
        parse(checkOut, "yyyy-MM-dd", new Date()),
        parse(checkIn, "yyyy-MM-dd", new Date())
      );
      if (los < 1) los = 1;
    } catch {}
  }

  const isValidAgodaUrl = (url: string) => {
    return /^https?:\/\/(www\.)?agoda\.com\//.test(url);
  };

  const handleSearch = async () => {
    setError("");
    setResults([]);
    setMin(null);
    if (!isValidAgodaUrl(input)) {
      setError("유효한 아고다 호텔 주소를 입력하세요.");
      return;
    }
    if (!checkIn || !checkOut) {
      setError("체크인/체크아웃 날짜를 선택하세요.");
      return;
    }
    if (los < 1) {
      setError("숙박일수는 1일 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    try {
      // 파라미터를 쿼리스트링으로 변환
      const params = new URLSearchParams({
        baseUrl: input,
        checkIn: checkIn,
        los: String(los),
        rooms: String(rooms),
        children: String(children),
        adults: String(adults),
      }).toString();
      const res = await fetch(
        `${process.env.REACT_APP_API_SERVER_URL}/agoda/prices?${params}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log(res);
      if (!res.ok) throw new Error("API 오류");
      const data = await res.json();
      setResults(data.results);
      setMin(data.min);
    } catch (e) {
      setError("API 호출 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>아고다 최저가 크롤러 - 툴박스</title>
        <meta
          name="description"
          content="아고다 호텔 최저가를 빠르게 확인하는 무료 크롤러 툴입니다."
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
            아고다 최저가 찾기
          </h2>
          <div style={{ width: "100%", marginBottom: 16 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="아고다 호텔 주소를 입력하세요"
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                border: "1px solid #333",
                borderRadius: 8,
                outline: "none",
                background: "#181c1f",
                color: "#fff",
                marginBottom: 10,
              }}
            />
            {/* 날짜 입력 UI */}
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 24,
                width: "100%",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#23272b",
                  borderRadius: 12,
                  border: "2px solid #2dd4bf",
                  padding: "12px 20px",
                  minWidth: 220,
                  gap: 12,
                }}
              >
                <FaCalendarAlt color="#2dd4bf" size={22} />
                <div>
                  <div style={{ fontSize: 13, color: "#aaa", marginBottom: 2 }}>
                    체크인
                  </div>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    style={{
                      background: "#181c1f",
                      color: "#fff",
                      border: "1px solid #333",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 15,
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#aaa", marginBottom: 2 }}>
                    체크아웃
                  </div>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    style={{
                      background: "#181c1f",
                      color: "#fff",
                      border: "1px solid #333",
                      borderRadius: 6,
                      padding: "4px 8px",
                      fontSize: 15,
                    }}
                  />
                </div>
              </div>
            </div>
            {/* 필요시 인원/객실 박스도 옆에 추가 */}

            {/* DatePicker는 숨김 input으로 두고, withPortal로 캘린더만 띄움 */}
            {/* <DatePicker
            id="date-picker"
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => {
              setDateRange(update as [Date | null, Date | null]);
              // 날짜 선택 시 자동으로 닫기
              setCalendarOpen(false);
            }}
            minDate={new Date()}
            dateFormat="yyyy-MM-dd"
            placeholderText="날짜 선택"
            withPortal
            open={calendarOpen}
            onClickOutside={() => setCalendarOpen(false)}
            customInput={
              <input
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: 0,
                  height: 0,
                  opacity: 0,
                  pointerEvents: "none",
                }}
                tabIndex={-1}
                readOnly
              />
            }
          /> */}
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <label style={{ color: "#e5e7eb", minWidth: 60 }}>방 개수</label>
              <input
                type="number"
                min={1}
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                placeholder="1"
                style={{
                  width: 70,
                  padding: 12,
                  fontSize: 16,
                  border: "1px solid #333",
                  borderRadius: 8,
                  background: "#181c1f",
                  color: "#fff",
                }}
              />
              <label style={{ color: "#e5e7eb", minWidth: 60 }}>성인수</label>
              <input
                type="number"
                min={1}
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                placeholder="2"
                style={{
                  width: 70,
                  padding: 12,
                  fontSize: 16,
                  border: "1px solid #333",
                  borderRadius: 8,
                  background: "#181c1f",
                  color: "#fff",
                }}
              />
              <label style={{ color: "#e5e7eb", minWidth: 60 }}>아이수</label>
              <input
                type="number"
                min={0}
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                placeholder="0"
                style={{
                  width: 70,
                  padding: 12,
                  fontSize: 16,
                  border: "1px solid #333",
                  borderRadius: 8,
                  background: "#181c1f",
                  color: "#fff",
                }}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                style={{
                  padding: "0 24px",
                  fontSize: 16,
                  background:
                    "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)",
                  color: "#181c1f",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  height: 44,
                  boxShadow: "0 2px 8px 0 rgba(243,244,246,0.12)",
                }}
              >
                {loading ? "조회 중..." : "최저가 조회"}
              </button>
            </div>
          </div>
          {error && (
            <div style={{ color: "#ff4f4f", marginBottom: 12 }}>{error}</div>
          )}
          {results.length > 0 && (
            <div style={{ width: "100%", marginTop: 16 }}>
              {/* 최저가 안내를 테이블 위로 이동, 링크도 함께 표시 */}
              {min && (
                <div
                  style={{
                    marginBottom: 16,
                    color: "#2dd4bf",
                    fontWeight: 700,
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <span>
                    최저가: {min.label} -{" "}
                    {min.price ? min.price.toLocaleString() + "원" : "-"}
                  </span>
                  {min.url && (
                    <a
                      href={min.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#fff",
                        background: "#2dd4bf",
                        borderRadius: 6,
                        padding: "4px 14px",
                        fontWeight: 700,
                        fontSize: 15,
                        marginLeft: 8,
                        textDecoration: "none",
                        transition: "background 0.2s",
                      }}
                    >
                      바로가기
                    </a>
                  )}
                </div>
              )}
              <table
                style={{
                  width: "100%",
                  background: "#181c1f",
                  borderRadius: 8,
                  color: "#e5e7eb",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "2px solid #333" }}>
                    {/* <th style={{ padding: 8 }}>CID</th> */}
                    <th style={{ padding: 8 }}>제휴사</th>
                    <th style={{ padding: 8 }}>호텔명</th>
                    <th style={{ padding: 8 }}>가격</th>
                    <th style={{ padding: 8 }}>링크</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr
                      key={r.label}
                      style={{
                        background:
                          min && r.label === min.label ? "#2dd4bf" : undefined,
                        color:
                          min && r.label === min.label ? "#181c1f" : undefined,
                        fontWeight: min && r.label === min.label ? 700 : 400,
                      }}
                    >
                      {/* <td style={{ padding: 8 }}>{r.cid}</td> */}
                      <td style={{ padding: 8 }}>{r.label}</td>
                      <td style={{ padding: 8 }}>{r.hotelName || "-"}</td>
                      <td style={{ padding: 8 }}>
                        {r.price ? r.price.toLocaleString() + "원" : "-"}
                      </td>
                      <td style={{ padding: 8 }}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color:
                              min && r.label === min.label
                                ? "#181c1f"
                                : "#2dd4bf",
                            fontWeight: 700,
                          }}
                        >
                          바로가기
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
