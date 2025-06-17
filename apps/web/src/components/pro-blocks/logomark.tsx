import type { CSSProperties } from "react";

interface LogoProps {
	width?: CSSProperties["width"];
	height?: CSSProperties["height"];
	className?: string;
}

export const Logomark: React.FC<LogoProps> = ({
	width = 32,
	height = "auto",
	className = "",
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			version="1.1"
			viewBox="0 0 310 310"
			className={className}
			width={width}
			height={height}
			fill="none"
			role="img"
			aria-label="logo"
		>
			<title>Diff Email logo</title>
			<g>
				<path
					className="fill-black dark:fill-white"
					d="M284.2,210.7l-78.6,94.3V5s78.6,94.3,78.6,94.3c26.9,32.3,26.9,79.1,0,111.4Z"
				/>
				<path
					className="fill-black dark:fill-white"
					d="M205.6,5h0s-142,0-142,0C31.6,5,5.6,31,5.6,63v184c0,32,26,58,58,58h142s-78.6-94.3-78.6-94.3c-26.9-32.3-26.9-79.1,0-111.4L205.6,5Z"
				/>
			</g>
		</svg>
	);
};
