import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function Home() {
  const { user, isLoading } = useUser();
  if (isLoading) return <p>Loading…</p>;
  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>Cookbook</h1>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px", color: "#666" }}>
              Welcome, {user.name || user.email}
            </span>
            <a 
              href="/api/auth/logout" 
              style={{ 
                padding: "6px 12px", 
                backgroundColor: "#dc3545", 
                color: "white", 
                textDecoration: "none", 
                borderRadius: "4px", 
                fontSize: "14px"
              }}
            >
              Logout
            </a>
          </div>
        )}
      </div>
      
      {user ? (
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <h2>Welcome to your personal cookbook!</h2>
          <p style={{ color: "#666", marginBottom: "30px" }}>
            Organize, search, and manage all your favorite recipes in one place.
          </p>
          <Link 
            href="/library" 
            style={{ 
              padding: "12px 24px", 
              backgroundColor: "#007bff", 
              color: "white", 
              textDecoration: "none", 
              borderRadius: "6px", 
              fontSize: "16px",
              display: "inline-block"
            }}
          >
            Go to Recipe Library →
          </Link>
        </div>
      ) : (
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <h2>Your Personal Recipe Collection</h2>
          <p style={{ color: "#666", marginBottom: "30px" }}>
            Save, organize, and search your favorite recipes with photo uploads and PDF export.
          </p>
          <a 
            href="/api/auth/login"
            style={{ 
              padding: "12px 24px", 
              backgroundColor: "#28a745", 
              color: "white", 
              textDecoration: "none", 
              borderRadius: "6px", 
              fontSize: "16px",
              display: "inline-block"
            }}
          >
            Get Started - Login
          </a>
        </div>
      )}
    </main>
  );
}


