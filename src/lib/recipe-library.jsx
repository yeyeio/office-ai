import React from "react";
import { createLibrary, defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui";
import { z } from "zod/v4";

const cardStyle = {
  display: "grid",
  gridTemplateRows: "120px auto 66px 1fr auto",
  gap: 8,
  height: "100%",
  padding: 12,
  border: "1px solid var(--openui-border-default, #e5e7eb)",
  borderRadius: 12,
  backgroundColor: "var(--openui-foreground, #ffffff)",
  color: "var(--openui-text-neutral-primary, #111827)",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
};

const actionStyle = {
  padding: "5px 8px",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export const RecipeRemix = defineComponent({
  name: "RecipeRemix",
  description: "Three sourced recipe suggestions.",
  props: z.object({
    recipes: z.array(
      z.object({
        title: z.string(),
        time: z.string(),
        servings: z.number().int().positive(),
        ingredients: z.array(z.string()),
        sourceUrl: z.string(),
        imageUrl: z.string().optional(),
      })
    ),
  }),
  component: function RecipeRemix({ props }) {
    const triggerAction = useTriggerAction();

    const handleInsertToWord = (recipe) => {
      if (typeof window !== "undefined" && window.__insertRecipeToWord) {
        window.__insertRecipeToWord(recipe);
      }
    };

    return (
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          width: "100%",
          margin: "8px 0",
        }}
      >
        <h2 style={{ gridColumn: "1 / -1", margin: 0, fontSize: 20, fontWeight: 700, color: "var(--openui-text-neutral-primary, #111827)" }}>
          Recipe Remix
        </h2>
        {props.recipes.map((recipe) => (
          <article key={recipe.title} style={cardStyle}>
            <div style={{ overflow: "hidden", borderRadius: 8, background: "var(--openui-highlight-subtle, #f3f4f6)", height: "120px", position: "relative" }}>
              {recipe.imageUrl?.startsWith("https://") ? (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  onError={(event) => (event.currentTarget.hidden = true)}
                  style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "32px" }}>
                  🍲
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {recipe.time}
              </span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "var(--openui-highlight-subtle, #f3f4f6)",
                  color: "var(--openui-text-neutral-secondary, #374151)",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Serves {recipe.servings}
              </span>
            </div>
            <h3 style={{ margin: "4px 0", fontSize: "14px", fontWeight: 700, lineHeight: 1.3 }}>{recipe.title}</h3>
            <div>
              <strong style={{ fontSize: "11.5px", color: "var(--openui-text-neutral-primary, #111827)" }}>Ingredients:</strong>
              <ul style={{ margin: "4px 0 0 0", paddingLeft: 18, fontSize: "12px", color: "var(--openui-text-neutral-secondary, #4b5563)" }}>
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient}>{ingredient}</li>
                ))}
              </ul>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto", paddingTop: 8, flexWrap: "wrap" }}>
              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...actionStyle,
                    border: "1px solid var(--openui-border-default, #d1d5db)",
                    color: "var(--openui-text-neutral-primary, #111827)",
                    backgroundColor: "transparent",
                  }}
                >
                  Source ↗
                </a>
              )}
              <button
                type="button"
                style={{ ...actionStyle, border: 0, background: "#111827", color: "#ffffff" }}
                onClick={() => triggerAction(`Make ${recipe.title} faster and simpler`)}
              >
                Remix this
              </button>
              <button
                type="button"
                style={{ ...actionStyle, border: "1px solid #6366f1", background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}
                onClick={() => handleInsertToWord(recipe)}
                title="Masukkan resep ini ke dokumen Word"
              >
                + Word 📝
              </button>
            </div>
          </article>
        ))}
      </section>
    );
  },
});

export const recipeLibrary = createLibrary({
  root: openuiLibrary.root ?? "Stack",
  componentGroups: openuiLibrary.componentGroups,
  components: [...Object.values(openuiLibrary.components), RecipeRemix],
});
