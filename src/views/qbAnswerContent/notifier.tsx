import { useState } from "react";

type NotifierProps = {
    promise: Promise<void>;
    message: string;
}

function Notifier({ promise, message }: NotifierProps) {
	const [isLoading, setIsLoading] = useState(true);
	promise.then(() => {
		setIsLoading(false);
		})
		.catch(() => {
			setIsLoading(false);
		});
	return (
		<>
			<div className={`h-auto border border-2 border-gray-500 rounded-md p-2 ${isLoading ? "" : "hidden"}`}>
				<p className="text-gray-800">{message}</p>
			</div>
		</>
	);
};

export default Notifier;