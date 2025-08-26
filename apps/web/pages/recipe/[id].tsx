import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { apiGet, apiPost, apiPut } from "../../lib/api";

type Recipe = { 
  id: string; 
  title: string; 
  servings: number;
  prep_minutes?: number;
  cook_minutes?: number;
  cuisine?: string;
  meal_type?: string;
  dietary_tags: string[];
  notes?: string;
  photo_url?: string;
  ingredients: string[];
  instructions: string[];
};

const MEAL_TYPES = ["Appetizer", "Main Course", "Dessert", "Side Dish", "Drink", "Other"];
const CUISINES = ["Italian", "Chinese", "Mexican", "Indian", "French", "Thai", "Japanese", "Mediterranean", "American", "Middle Eastern", "Other"];

export default function RecipeView() {
  const { query } = useRouter();
  const { user } = useUser();
  const [r, setR] = useState<Recipe | null>(null);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form fields for editing
  const [title, setTitle] = useState("");
  const [servings, setServings] = useState(2);
  const [prepMinutes, setPrepMinutes] = useState<number | "">("");
  const [cookMinutes, setCookMinutes] = useState<number | "">("");
  const [cuisine, setCuisine] = useState("");
  const [mealType, setMealType] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  
  const id = query.id as string;

  const loadRecipeIntoForm = (recipe: Recipe) => {
    setTitle(recipe.title);
    setServings(recipe.servings);
    setPrepMinutes(recipe.prep_minutes || "");
    setCookMinutes(recipe.cook_minutes || "");
    setCuisine(recipe.cuisine || "");
    setMealType(recipe.meal_type || "");
    setTags((recipe.dietary_tags || []).join(", "));
    setNotes(recipe.notes || "");
    setIngredientsText((recipe.ingredients || []).join("\n"));
    setInstructionsText((recipe.instructions || []).join("\n"));
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch("/api/upload-photo", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    const data = await response.json();
    return data.photo_url;
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      const data = await apiGet<Recipe>(`/api/recipes/${id}`);
      setR(data);
    })().catch(console.error);
  }, [id]);

  if (!r) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <p style={{ fontSize: "18px", color: "#666" }}>Loading recipe...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: "white", 
        borderBottom: "1px solid #dee2e6", 
        padding: "16px 0",
        marginBottom: "32px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <a href="/library" style={{ 
              color: "#6c757d", 
              textDecoration: "none", 
              fontSize: "14px",
              padding: "8px 12px",
              borderRadius: "4px",
              border: "1px solid #dee2e6"
            }}>
              ← Back to Library
            </a>
            <h1 style={{ margin: 0, fontSize: "28px", color: "#212529" }}>Recipe Details</h1>
          </div>
          
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "14px", color: "#666" }}>
                {user.name || user.email}
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
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        {!editing ? (
          /* View Mode */
          <>
            {/* Hero Section */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "12px", 
              padding: "32px", 
              marginBottom: "24px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
              <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <h1 style={{ margin: "0 0 16px 0", fontSize: "36px", color: "#212529" }}>{r.title}</h1>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "18px" }}>🍽️</span>
                      <span style={{ fontSize: "16px", color: "#495057" }}>{r.servings} serving{r.servings !== 1 ? 's' : ''}</span>
                    </div>
                    {r.prep_minutes && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "18px" }}>⏱️</span>
                        <span style={{ fontSize: "16px", color: "#495057" }}>{r.prep_minutes} min prep</span>
                      </div>
                    )}
                    {r.cook_minutes && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "18px" }}>🔥</span>
                        <span style={{ fontSize: "16px", color: "#495057" }}>{r.cook_minutes} min cook</span>
                      </div>
                    )}
                    {r.cuisine && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "18px" }}>🌍</span>
                        <span style={{ fontSize: "16px", color: "#495057" }}>{r.cuisine}</span>
                      </div>
                    )}
                    {r.meal_type && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "18px" }}>🍴</span>
                        <span style={{ fontSize: "16px", color: "#495057" }}>{r.meal_type}</span>
                      </div>
                    )}
                  </div>
                  
                  {r.dietary_tags && r.dietary_tags.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {r.dietary_tags.map(tag => (
                          <span key={tag} style={{ 
                            backgroundColor: "#e9ecef", 
                            color: "#495057", 
                            padding: "4px 8px", 
                            borderRadius: "12px", 
                            fontSize: "14px" 
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {r.notes && (
                    <div style={{ 
                      backgroundColor: "#fff3cd", 
                      border: "1px solid #ffeaa7", 
                      padding: "16px", 
                      borderRadius: "8px", 
                      marginBottom: "16px" 
                    }}>
                      <strong style={{ color: "#856404" }}>Chef's Notes:</strong>
                      <p style={{ margin: "8px 0 0 0", color: "#856404" }}>{r.notes}</p>
                    </div>
                  )}
                  
                  <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                    <button 
                      onClick={() => {
                        setEditing(true);
                        loadRecipeIntoForm(r);
                      }}
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "16px",
                        cursor: "pointer"
                      }}
                    >
                      ✏️ Edit Recipe
                    </button>
                    
                    {user && (
                      <button 
                        onClick={async ()=>{
                          const out = await apiPost<{url:string}>(`/api/recipes/${id}/export-pdf`, { style: "minimal" });
                          window.open(out.url, "_blank");
                        }}
                        style={{
                          padding: "12px 24px",
                          backgroundColor: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "16px",
                          cursor: "pointer"
                        }}
                      >
                        📄 Export PDF
                      </button>
                    )}
                  </div>
                </div>
                
                {r.photo_url && (
                  <div style={{ flexShrink: 0 }}>
                    <img 
                      src={r.photo_url} 
                      alt={r.title} 
                      style={{ 
                        width: "300px", 
                        height: "300px", 
                        objectFit: "cover", 
                        borderRadius: "12px",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                      }} 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Ingredients & Instructions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {/* Ingredients */}
              <div style={{ 
                backgroundColor: "white", 
                borderRadius: "12px", 
                padding: "24px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", color: "#212529", borderBottom: "2px solid #007bff", paddingBottom: "8px" }}>
                  🥘 Ingredients
                </h2>
                <ul style={{ margin: 0, padding: "0 0 0 20px" }}>
                  {(r.ingredients ?? []).map((ingredient: string, i: number) => (
                    <li key={i} style={{ 
                      marginBottom: "8px", 
                      fontSize: "16px", 
                      lineHeight: "1.5",
                      color: "#495057"
                    }}>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Instructions */}
              <div style={{ 
                backgroundColor: "white", 
                borderRadius: "12px", 
                padding: "24px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", color: "#212529", borderBottom: "2px solid #28a745", paddingBottom: "8px" }}>
                  👨‍🍳 Instructions
                </h2>
                <ol style={{ margin: 0, padding: "0 0 0 20px" }}>
                  {(r.instructions ?? []).map((instruction: string, i: number) => (
                    <li key={i} style={{ 
                      marginBottom: "12px", 
                      fontSize: "16px", 
                      lineHeight: "1.6",
                      color: "#495057"
                    }}>
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        ) : (
          /* Edit Mode - Modal */
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px"
          }}>
            {/* Edit form will go here - we'll add it next */}
          </div>
        )}
      </div>
    </div>
  );
}


