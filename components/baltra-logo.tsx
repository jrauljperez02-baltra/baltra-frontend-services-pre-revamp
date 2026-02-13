import Image from 'next/image';
import type { ComponentProps } from 'react';

interface BaltraLogoProps
    extends Omit<ComponentProps<typeof Image>, 'src' | 'alt'> {
    className?: string;
}

export function BaltraLogo({ className, ...props }: BaltraLogoProps) {
    return (
        <Image
            src="/baltra-logo.png"
            alt="Baltra Logo"
            width={32}
            height={32}
            className={className}
            {...props}
        />
    );
}
