import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends React.ComponentProps<typeof Image> {
	/** Fallback URL used when the primary image fails */
	fallbackSrc: string;
	fallbackClassName?: string;
}

export function ImageWithFallback({
	src,
	alt,
	className,
	fallbackSrc,
	fallbackClassName,
	...rest
}: ImageWithFallbackProps) {
	const [hasError, setHasError] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset error flag only when src changes intentionally
	useEffect(() => {
		setHasError(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [src]);

	return (
		<Image
			{...rest}
			src={hasError ? fallbackSrc : src}
			alt={alt}
			onError={() => setHasError(true)}
			className={cn(className, hasError && fallbackClassName)}
		/>
	);
}
