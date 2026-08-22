import Image from "next/image";

export default function ProductImage({
  src,
  alt,
  className,
  fill,
}: {
  src: string | null;
  alt: string;
  className?: string;
  fill?: boolean;
}) {
  const url = src || "/placeholder.svg";
  if (fill) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className={`object-cover ${className ?? ""}`}
        unoptimized
      />
    );
  }
  return (
    <Image
      src={url}
      alt={alt}
      width={600}
      height={600}
      className={`object-cover ${className ?? ""}`}
      unoptimized
    />
  );
}
