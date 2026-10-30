import Image from "next/image";

type EditorialImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

export default function EditorialImage({
  src,
  alt,
  sizes,
  className = "object-cover",
  priority = false,
}: EditorialImageProps) {
  if (src.startsWith("https://")) {
    return <img src={src} alt={alt} className={`h-full w-full ${className}`} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
    />
  );
}
