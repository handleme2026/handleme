import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f0f0f",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        textAlign: "center",
        padding: "20px",
        gap: "24px",
      }}
    >
      <div>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>HandleMe</h1>
        <p style={{ opacity: 0.7, maxWidth: "520px", margin: "0 auto" }}>
          A curated gallery for hand admiration. Soft. Strong. Playful. Sensual.
        </p>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/gallery"
          style={{
            padding: "12px 24px",
            borderRadius: "12px",
            backgroundColor: "#ff4d6d",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          Enter Gallery
        </Link>

        <Link
          href="/submit"
          style={{
            padding: "12px 24px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          Submit a Photo
        </Link>
      </div>
            <div style={{ marginTop: "10px" }}>
        <p style={{ opacity: 0.6, marginBottom: "12px", fontSize: "0.95rem" }}>
          Support HandleMe and help us grow. Every little bit helps.
        </p>

        <a
          href="https://www.paypal.com/donate/?hosted_button_id=FZMFT93D3TKWG"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "10px 22px",
            borderRadius: "12px",
            backgroundColor: "#222",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          ❤️ Support the Site
        </a>
      </div>
    </main>
  );
}
