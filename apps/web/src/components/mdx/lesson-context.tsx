"use client";

import { createContext, useContext } from "react";

/** Provides the current lesson slug to embedded MDX components (Quiz progress recording). */
export const LessonContext = createContext<string | null>(null);

export function useLessonSlug(): string | null {
  return useContext(LessonContext);
}
