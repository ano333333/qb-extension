import type { Dayjs } from "dayjs";
import { useMemo, useState } from "react";

export type ReviewPlansTableProps = {
	reviewPlans: Array<{
		questionId: string;
		url: string;
		reviewLimit: Dayjs;
	}>;
};

const PAGE_SIZE = 10;

export function ReviewPlansTable({ reviewPlans }: ReviewPlansTableProps) {
	const [page, setPage] = useState(0);
	const pageReviewPlans = useMemo(() => {
		const plans: Array<{
			questionId: string;
			url: string;
			reviewLimit: Dayjs;
		}> = reviewPlans.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
		if (plans.length < PAGE_SIZE) {
			plans.push(...Array(PAGE_SIZE - plans.length).fill(undefined));
		}
		return plans;
	}, [page, reviewPlans]);
	const isFirstPage = page === 0;
	const isLastPage = page === Math.floor(reviewPlans.length / PAGE_SIZE);

	return (
		<div className="p-2 flex flex-col">
			<table className="w-full m-1 border-collapse border border-gray-300">
				<thead className="bg-gray-200 text-left">
					<tr className="grid grid-cols-8">
						<th className="col-span-1">質問ID</th>
						<th className="col-span-5">質問URL</th>
						<th className="col-span-2">復習期限</th>
					</tr>
				</thead>
				<tbody>
					{pageReviewPlans.map((reviewPlan) => (
						<tr
							className="grid grid-cols-8 h-[2em]"
							key={reviewPlan?.questionId}
						>
							<td className="col-span-1">{reviewPlan?.questionId}</td>
							<td className="col-span-5">
								<a
									href={reviewPlan?.url}
									target="_blank"
									rel="noreferrer"
									className="text-blue-500 underline hover:text-blue-700"
								>
									{reviewPlan?.url}
								</a>
							</td>
							<td className="col-span-2">
								{reviewPlan?.reviewLimit.format("YYYY/MM/DD")}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<div className="flex justify-center">
				<button
					onClick={() => {
						if (isFirstPage) return;
						setPage(page - 1);
					}}
					type="button"
					className="bg-gray-200 border border-gray-300 rounded rounded-r-none p-1 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={isFirstPage}
				>
					{"<"}
				</button>
				<p className="w-10 text-center border border-r-0 border-l-0 border-gray-300 p-1">
					{page + 1}
				</p>
				<button
					onClick={() => {
						if (isLastPage) return;
						setPage(page + 1);
					}}
					type="button"
					className="bg-gray-200 border border-gray-300 rounded rounded-l-none p-1 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={isLastPage}
				>
					{">"}
				</button>
			</div>
		</div>
	);
}
