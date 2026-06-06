import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
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
          background: "#e5950f",
          borderRadius: 40,
        }}
      >
        <span
          style={{
            fontSize: 112,
            fontWeight: 800,
            color: "#2a2418",
            lineHeight: 1,
            marginTop: -4,
          }}
        >
          T
        </span>
      </div>
    ),
    { ...size },
  );
}
