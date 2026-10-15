export const getRecipeProfileTool = {
  type: "function",
  name: "get_recipe_profile",
  description:
    "Read the cook's pantry and recipe preferences. Call this before recommending pantry recipes.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  },
  strict: true,
};

export async function executeGetRecipeProfile() {
  return JSON.stringify({
    pantry: ["black beans", "corn", "canned tomatoes", "rice", "cheddar"],
    diet: "vegetarian",
    cuisine: "American",
    maxMinutes: 30,
    servings: 2,
  });
}
