import { ImageResponse } from "next/og";

export const size = {
  width: 800,
  height: 400,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "800px",
          height: "400px",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(680px 420px at 78% 8%, #CFEFE2 0%, transparent 62%), radial-gradient(520px 380px at 6% 96%, #FFE9D9 0%, transparent 60%), #DBF1E9",
          color: "#2C2A29",
          display: "flex",
          alignItems: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <svg
          width="800"
          height="400"
          viewBox="0 0 800 400"
          style={{
            position: "absolute",
            inset: 0,
          }}
        >
          <defs>
            <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse" x="8" y="8">
              <circle cx="1.6" cy="1.6" r="1.6" fill="rgba(47,139,110,0.16)" />
            </pattern>
            <linearGradient id="fade" x1="0" y1="0" x2="800" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="white" stopOpacity="0.5" />
              <stop offset="0.7" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="dots-mask">
              <rect width="800" height="400" fill="url(#fade)" />
            </mask>
          </defs>

          <rect width="800" height="400" fill="url(#dots)" mask="url(#dots-mask)" />

          <path
            d="M-40 300 C 140 250, 200 360, 360 300 C 520 240, 600 330, 880 250"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="11"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M-40 300 C 140 250, 200 360, 360 300 C 520 240, 600 330, 880 250"
            fill="none"
            stroke="#6FC2A6"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray="2 12"
          />
          <circle cx="120" cy="284" r="9" fill="#FFFFFF" stroke="#6FC2A6" strokeWidth="4" />
          <circle cx="690" cy="276" r="8" fill="#FF9BA6" />
        </svg>

        <div
          style={{
            position: "relative",
            padding: "0 52px",
            display: "flex",
            alignItems: "center",
            gap: 36,
            width: "100%",
          }}
        >
          <div
            style={{
              width: 156,
              height: 156,
              borderRadius: 44,
              background: "#FFFFFF",
              boxShadow: "0 18px 36px -14px rgba(47,107,80,0.42), 0 3px 8px rgba(47,107,80,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 12,
                borderRadius: 32,
                border: "2.5px dashed rgba(47,139,110,0.28)",
              }}
            />
            <svg width="92" height="80" viewBox="0 0 28 24" fill="none" aria-hidden="true">
              <path
                d="M2.2 16.8c0-1 .6-1.5 1.6-1.6l4-.4 3.5-2.4c1-.7 2-1.1 3.2-1.1h4.6c1.6 0 3 .5 4 1.5l3.3 3.2c.7.7 1 1.5 1 2.4 0 1.4-1.1 2.4-2.5 2.4H5.3c-1.7 0-3.1-1.3-3.1-2.9 0-.4 0-.7 0-1.1z"
                fill="#2C2A29"
              />
              <path
                d="M7.6 14.6l3.5-3 1.2-2c.5-.8 1.4-1.3 2.3-1.1l3.8.6c.9.2 1.6 1 1.6 2v2.8"
                stroke="#2C2A29"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M12.4 12.4l1-.6M14 11.6l1.4-.8M15.8 10.9l1.5-.7"
                stroke="#fff"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path d="M4 18.4h22" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" />
              <circle cx="25.5" cy="9" r="2" fill="#FFCF4D" />
            </svg>
          </div>

          <div
            style={{
              minWidth: 0,
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(255,255,255,0.78)",
                border: "1.5px solid rgba(47,139,110,0.22)",
                padding: "6px 14px 6px 11px",
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 700,
                color: "#2F8B6E",
                letterSpacing: "-0.01em",
                marginBottom: 16,
                alignSelf: "flex-start",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: "#6FC2A6",
                  flexShrink: 0,
                }}
              />
              지도 위에 그리는 러닝 코스
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 800,
                color: "#2C2A29",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              뜀<span style={{ color: "#6FC2A6" }}>로그</span>
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 22,
                fontWeight: 600,
                color: "#4A423D",
                letterSpacing: "-0.02em",
                lineHeight: 1.45,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span>동네 러닝 코스를 미리 그려보고</span>
              <span>
                <b style={{ color: "#2C2A29", fontWeight: 800 }}>공유해요</b>
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 30,
            bottom: 22,
            fontSize: 15,
            fontWeight: 700,
            color: "rgba(44,42,41,0.42)",
            letterSpacing: "0.01em",
          }}
        >
          dduim.log
        </div>
      </div>
    ),
    size,
  );
}
