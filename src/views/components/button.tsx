export type ButtonProps = {
	label: string;
	className?: string;
	onClick: () => void;
};

export function Button({ label, onClick, className }: ButtonProps) {
	return (
		<button
			type="button"
			onClick={(e) => {
				e.preventDefault();
				onClick();
			}}
			className={`bg-gray-300 border rounded-md px-2 py-1 hover:bg-gray-400 ${className}`}
		>
			{label}
		</button>
	);
}
