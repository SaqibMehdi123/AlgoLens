"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/** Dark-default theme toggle; persists to localStorage and toggles the `.light` class. */
export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("algolens-theme", next ? "light" : "dark");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      className="grid size-9 place-items-center rounded-lg text-secondary transition-colors hover:bg-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {light ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
    </button>
  );
}
