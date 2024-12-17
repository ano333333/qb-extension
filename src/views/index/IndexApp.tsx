import { useEffect, useRef, useState } from "react";
import { container } from "../../inversify.config";
import { TYPES } from "../../types";
import { IndexController } from "../../controllers/indexController";
import type { LocalStorageService } from "../../services/localStorageService/localStorageService";
import dayjs, { type Dayjs } from "dayjs";
import { Button } from "../components/button";
import { ReviewPlansTable } from "./reviewPlansTable";

function IndexApp() {
	const controllerRef = useRef(
		new IndexController(
			container.get<LocalStorageService>(TYPES.ILocalStorageService),
		),
	);
	const [reviewPlans, setReviewPlans] = useState<
		Array<{
			questionId: string;
			url: string;
			reviewLimit: Dayjs;
		}>
	>([]);
	useEffect(() => {
		controllerRef.current.getReviewPlans().then((reviewPlans) => {
			setReviewPlans(reviewPlans);
		});
	}, []);
	const today = dayjs();
	const onDownloadDumpDataClick = async () => {
		const url = await controllerRef.current.getDumpDataURL();
		const a = document.createElement("a");
		a.href = url;
		a.download = `${today.format("YYYYMMDDHHmmss")}.json`;
		a.click();
	};
	const onDumpFileInputChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (file) {
			await controllerRef.current.loadDumpData(file);
		}
	};
	return (
		<>
			<div className="p-2 flex flex-row">
				<Button
					label="dump"
					onClick={onDownloadDumpDataClick}
					className="m-1"
				/>
				<input type="file" onChange={onDumpFileInputChange} className="m-1" />
			</div>
			<div className="p-2 w-full flex flex-col">
				<div className="flex flex-row">
					<h1 className="text-xl m-1">
						{today.format("YYYY/MM/DD")}の復習予定({reviewPlans.length})
					</h1>
					<Button
						label="refresh"
						onClick={async () => {
							setReviewPlans(await controllerRef.current.getReviewPlans());
						}}
						className="m-1"
					/>
				</div>
				<div className="w-1/2">
					<ReviewPlansTable reviewPlans={reviewPlans} />
				</div>
			</div>
		</>
	);
}

export default IndexApp;
