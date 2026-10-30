import type { ArticlePreview } from "@/lib/article-types";

const categoryImages: Record<string, { src: string; alt: string }> = {
  World: { src: "/figma/city.png", alt: "City skyline and public transport" },
  Technology: { src: "/figma/tram.png", alt: "Modern public transport on a tree-lined street" },
  Climate: { src: "/figma/energy.png", alt: "Wind turbines in a mountain landscape" },
  Finance: { src: "/figma/work.png", alt: "Laptop and coffee on a desk" },
  Gaming: { src: "/figma/coast.png", alt: "Town beside a mountain lake" },
};

export function getArticleImage(article: Pick<ArticlePreview, "category" | "featured_image_url" | "image_alt">) {
  if (article.featured_image_url) {
    return { src: article.featured_image_url, alt: article.image_alt || article.category + " story" };
  }
  return categoryImages[article.category] ?? categoryImages.World;
}

export function formatPublishedDate(value: string | null, style: "short" | "long" = "short") {
  if (!value) return "Publication date pending";
  return new Intl.DateTimeFormat("en", {
    dateStyle: style === "long" ? "long" : "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}
