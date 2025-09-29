import { PUBLIC_BASE_PATH } from "../config";

export const Img = ({
  src,
  alt,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img
    src={`${PUBLIC_BASE_PATH || ""}/${
      typeof src === "string" ? src : "Icons/no-image-placeholder.png"
    }`}
    alt={alt}
    {...rest}
  />
);
