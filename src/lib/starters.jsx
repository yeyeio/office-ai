import React from "react";
import { Utensils, Zap, Sparkles } from "lucide-react";

export const STARTERS = [
  {
    displayText: "Cook from my pantry",
    prompt: "What can I make for dinner with what I already have?",
    icon: <Utensils size={15} />,
  },
  {
    displayText: "Find a high-protein dinner",
    prompt: "What are three quick, high-protein vegetarian dinners I could make?",
    icon: <Zap size={15} />,
  },
  {
    displayText: "Remix a comfort food",
    prompt: "Can you give me three lighter or quicker spins on mac and cheese?",
    icon: <Sparkles size={15} />,
  },
];
