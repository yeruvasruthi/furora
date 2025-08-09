import React from "react";

/** Uses /public/logo.jpeg and supports className for sizing (e.g., w-8 h-8). */
type LogoProps = React.HTMLAttributes<HTMLDivElement>;

export default function Logo({ className = "", ...rest }: LogoProps) {
  return (
    <div className={className} {...rest}>
      <img
        src="/logo.jpeg"              // file lives in /public/logo.jpeg
        alt="Furora Logo"
        className="w-full h-full object-contain rounded-full"
        draggable={false}
      />
    </div>
  );
}
