const rawBase = import.meta.env.BASE_URL;
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export const SITE = {
  title: "PokerFaceWen",
  description: "A fanatical open sourceror and design engineer.",
  author: "PokerFaceWen",
  email: "17889786156@163.com",
  github: "https://github.com/PokerFaceWen",
  nav: [
    { name: "Blog", path: `${base}blog`, icon: "article" },
    { name: "Projects", path: `${base}projects`, icon: "lightbulb" },
    { name: "Photos", path: `${base}photos`, icon: "image" },
    { name: "About", path: `${base}about`, icon: "user" },
  ],
  social: [
    { name: "GitHub", url: "https://github.com/PokerFaceWen", icon: "github" },
  ],
};
