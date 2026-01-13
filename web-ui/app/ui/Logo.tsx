import Image from "next/image";

interface LogoProps {
    className?: string;
}

export default function Logo({ className }: LogoProps) {
    return (
        <Image
            src="/sobres_logo.png"
            alt="Sobres logo"
            priority
            width={300}
            height={300}
            className={`object-contain ${className}`}
        />
    );
}