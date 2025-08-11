import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: [
      "src/app/api/instagram-data/route.ts", 
      "src/app/page.tsx",
      "src/components/ui/time-chart.tsx",
      "src/components/ui/chart-card.tsx"
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/components/ui/input.tsx"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];

export default eslintConfig;
