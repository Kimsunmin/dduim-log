import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FDFCF8",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            width: 138,
            height: 138,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#BFE8D8",
            border: "6px solid #FFFFFF",
            borderRadius: 44,
            boxShadow: "0 12px 28px rgba(47,139,110,0.18)",
          }}
        >
          <svg width="108" height="108" viewBox="0 0 108 108" fill="none">
            <path
              d="M28 22C48 27 72 49 78 80"
              stroke="#2F8B6E"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <circle cx="28" cy="22" r="10" fill="#FDFCF8" stroke="#2F8B6E" strokeWidth="6" />
            <circle cx="78" cy="80" r="11" fill="#FF8FA3" stroke="#FDFCF8" strokeWidth="6" />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
