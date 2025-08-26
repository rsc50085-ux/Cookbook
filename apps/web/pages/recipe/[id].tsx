import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiGet, apiPost } from "../../lib/api";

export default function RecipeView() {
  const { query } = useRouter();
  const { user } = useUser();
  const [r, setR] = useState<any>(null);
  const id = query.id as string;

  useEffect(() => {
    if (!id) return;
    (async () => {
      const data = await apiGet<any>(`/api/recipes/${id}`);
      setR(data);
    })().catch(console.error);
  }, [id]);

  if (!r) return <p>Loading…</p>;
  return (
    <main style={{ padding: 24, maxWidth: 800 }}>
      {user && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px", color: "#666" }}>
              {user.name || user.email}
            </span>
            <a 
              href="/api/auth/logout" 
              style={{ 
                padding: "4px 8px", 
                backgroundColor: "#dc3545", 
                color: "white", 
                textDecoration: "none", 
                borderRadius: "4px", 
                fontSize: "12px"
              }}
            >
              Logout
            </a>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 8px 0" }}>{r.title}</h1>
          <div style={{ color: "#666", marginBottom: 16 }}>
            {r.servings} serving{r.servings !== 1 ? 's' : ''}
            {r.prep_minutes && ` • ${r.prep_minutes} min prep`}
            {r.cook_minutes && ` • ${r.cook_minutes} min cook`}
            {r.cuisine && ` • ${r.cuisine}`}
            {r.meal_type && ` • ${r.meal_type}`}
          </div>
          {r.dietary_tags && r.dietary_tags.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <strong>Tags:</strong> {r.dietary_tags.join(", ")}
            </div>
          )}
          {r.notes && (
            <div style={{ backgroundColor: "#f9f9f9", padding: 12, borderRadius: 4, marginBottom: 16 }}>
              <strong>Notes:</strong> {r.notes}
            </div>
          )}
        </div>
        {r.photo_url && (
          <div>
            <img 
              src={r.photo_url} 
              alt={r.title} 
              style={{ width: 200, height: 200, objectFit: "cover", borderRadius: 8 }} 
            />
          </div>
        )}
      </div>
      
      <div style={{ display: "flex", gap: 40 }}>
        <div style={{ flex: 1 }}>
          <h3>Ingredients</h3>
          <ul>
            {(r.ingredients ?? []).map((ingredient: string, i: number) => (
              <li key={i} style={{ marginBottom: 4 }}>{ingredient}</li>
            ))}
          </ul>
        </div>
        
        <div style={{ flex: 1 }}>
          <h3>Instructions</h3>
          <ol>
            {(r.instructions ?? []).map((instruction: string, i: number) => (
              <li key={i} style={{ marginBottom: 8 }}>{instruction}</li>
            ))}
          </ol>
        </div>
      </div>
      
      <div style={{ marginTop: 32, borderTop: "1px solid #eee", paddingTop: 16 }}>
        <a href="/library" style={{ marginRight: 16, textDecoration: "none", color: "#0066cc" }}>
          ← Back to Library
        </a>
        {user && (
          <button onClick={async ()=>{
            const out = await apiPost<{url:string}>(`/api/recipes/${id}/export-pdf`, { style: "minimal" });
            window.open(out.url, "_blank");
          }}>
            Export PDF
          </button>
        )}
      </div>
    </main>
  );
}


