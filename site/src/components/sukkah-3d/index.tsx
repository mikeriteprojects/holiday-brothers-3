"use client";

import dynamic from "next/dynamic";

// WebGL/Canvas needs a real browser — never rendered during SSR.
export const SukkahScene = dynamic(() => import("./sukkah-scene").then((m) => m.SukkahScene), {
  ssr: false,
});

export type { SukkahType } from "./sukkah-model";
