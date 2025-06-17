import type { CSSProperties } from "react";

interface LogoProps {
	width?: CSSProperties["width"];
	height?: CSSProperties["height"];
	className?: string;
}

export const Logo: React.FC<LogoProps> = ({
	width = 32,
	height = "auto",
	className = "",
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			version="1.1"
			viewBox="0 0 1280 310"
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
					d="M282.8,210.7l-78.6,94.3V5l78.6,94.3c26.9,32.3,26.9,79.1,0,111.4h0Z"
				/>
				<path
					className="fill-black dark:fill-white"
					d="M204.3,5H62.3C30.2,5,4.3,31,4.3,63v184c0,32,26,58,58,58h142l-78.6-94.3c-26.9-32.3-26.9-79.1,0-111.4L204.3,5Z"
				/>
			</g>
			<g>
				<path
					className="fill-black dark:fill-white"
					d="M482,69.5v175h-32.2v-14.8c-9,11.5-22.2,18.2-40.5,18.2-33.5,0-61-28.8-61-66s27.5-66,61-66,40.5,16.1,40.5,18.2v-64.8h32.2v.2ZM449.7,182c0-21-14.8-35.2-34.5-35.2s-34.8,14.2-34.8,35.2,14.8,35.2,34.8,35.2,34.5-14.2,34.5-35.2Z"
				/>
				<path
					className="fill-black dark:fill-white"
					d="M495.2,84.7c0-10.8,9-20,19.8-20s20,9.2,20,20-9,19.8-20,19.8-19.8-9-19.8-19.8ZM499,119.5h32.2v125h-32.2v-125Z"
				/>
				<path
					className="fill-black dark:fill-white"
					d="M658.2,115.7v3.8h26.5v31h-26.5v94h-32.2v-94h-37v94h-32.2v-94h-18v-31h18v-1.2c0-34.5,19-54.8,58.8-52.2v31c-16.8-1.2-26.5,4.2-26.5,21.2v1.2h37v-3.8c0-34.5,19.2-54.8,58.8-52.2v31c-16.5-1.2-26.5,4.2-26.5,21.2h-.2Z"
				/>
				<path
					className="fill-black dark:fill-white"
					d="M669.5,226.5c0-11.8,9.5-21.2,21.2-21.2s21.2,9.5,21.2,21.2-9.5,21.2-21.2,21.2-21.2-9.5-21.2-21.2Z"
				/>
				<path
					className="fill-black dark:fill-white"
					d="M779,218.7c12.5,0,22.5-5.2,28-12.5l26,15c-11.8,17-30.5,26.8-54.5,26.8-42,0-68.5-28.8-68.5-66s26.8-66,66-66,63.2,29.2,63.2,66,0,10.1,0,13.2h-1.2s-94.2,0-94.2,0c4.5,16.5,18.2,23.5,35.2,23.5ZM807,170.2c-4-18-17.5-25.2-31-25.2s-29,9.2-32.8,25.2h63.8Z"
				/>
				<path
					className="fill-black dark:fill-white"
					d="M1034.7,167.5v77h-32.2v-74.8c0-14.8-7.5-23.8-21-23.8s-23.2,9.5-23.2,28.2v70.2h-32.2v-74.8c0-14.8-7.5-23.8-21-23.8s-23.5,9.5-23.5,28.2v70.2h-32.2v-125h32.2v13.2c7-10.5,18.8-16.8,34.8-16.8s27,6.5,34,18c7.8-11.2,20.2-18,37.2-18,28.5,0,47.2,20.2,47.2,51.5v.5Z"
				/>
				<path
					className="fill-black dark:fill-white"
					d="M1177,119.5v125h-32.2v-14.8c-9,11.2-22.5,18.2-40.8,18.2-33.2,0-60.8-28.8-60.8-66s27.5-66,60.8-66,40.8,16.2,40.8,18.2v-14.8h32.2v.2ZM1144.7,182c0-21-14.8-35.2-34.8-35.2s-34.5,14.2-34.5,35.2,14.8,35.2,34.5,35.2,34.8-14.2,34.8-35.2Z"
				/>
				<path
					className="fill-black dark:fill-white"
					d="M1190,84.7c0-10.8,9-20,19.8-20s20,9.2,20,20-9,19.8-20,19.8-19.8-9-19.8-19.8ZM1193.7,119.5h32.2v125h-32.2v-125Z"
				/>
				<path
					className="fill-black dark:fill-white"
					d="M1243,62h32.2v182.5h-32.2V62Z"
				/>
			</g>
		</svg>
	);
};
