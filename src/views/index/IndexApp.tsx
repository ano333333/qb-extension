import { useRef, useState } from "react";
import { container } from "../../inversify.config";
import { TYPES } from "../../types";
import { IndexController } from "../../controllers/indexController";
import type { LocalStorageService } from "../../services/localStorageService/localStorageService";
import dayjs, { type Dayjs } from "dayjs";

function IndexApp() {
	const controllerRef = useRef(
		new IndexController(
			container.get<LocalStorageService>(TYPES.LocalStorageService),
		),
	);
	const [reviewPlans, setReviewPlans] = useState<
		Array<{
			questionId: string;
			url: string;
			reviewLimit: Dayjs;
		}>
	>([]);
	const today = dayjs();
	return (
		<>
			<h1 className="text-xl">{today.format("YYYY/MM/DD")}の復習予定</h1>
			<button
				type="button"
				onClick={async () => {
					setReviewPlans(await controllerRef.current.getReviewPlans());
				}}
			>
				refresh
			</button>
			<table>
				<thead>
					<tr>
						<th>質問ID</th>
						<th>質問URL</th>
						<th>復習期限</th>
					</tr>
				</thead>
				<tbody>
					{reviewPlans.map((reviewPlan) => (
						<tr key={reviewPlan.questionId}>
							<td>{reviewPlan.questionId}</td>
							<td>
								<a href={reviewPlan.url} target="_blank" rel="noreferrer">
									{reviewPlan.url}
								</a>
							</td>
							<td>{reviewPlan.reviewLimit.format("YYYY/MM/DD")}</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
}

export default IndexApp;