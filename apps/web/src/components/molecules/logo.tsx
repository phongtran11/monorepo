import Image from 'next/image';

type LogoProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

function Logo({ src, alt, width = 100, height = 20 }: LogoProps) {
  return (
    <div data-slot="logo">
      <Image
        className="dark:invert"
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority
      />
    </div>
  );
}

export { Logo, type LogoProps };
