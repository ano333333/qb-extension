import type { Dayjs } from "dayjs";
import type { LocalStorageService } from "../services/localStorageService/localStorageService";
import type { AnswerResultEnum } from "../logics/answerResultEnum";
import { calcNextReviewDate } from "../logics/calcNextReviewDate";

/**
 * 問題IDと新しい回答日付から、local storageの更新・登録を行う
 * @param localStorageService
 * @param questionId
 * @param setId
 * @param answerDate
 * @param result
 * @returns
 */
export async function upsertAnswerResultAndReviewPlan(
	localStorageService: LocalStorageService,
	questionId: string,
	setId: string,
	answerDate: Dayjs,
	result: AnswerResultEnum,
) {
	const answerResults =
		await localStorageService.getAnswerResultsByQuestionId(questionId);

	// この問題に対する、answerDate以前の一番最近の回答履歴を取得
	const filteredAnswerResults = answerResults.filter(
		(answerResult) => !answerResult.answerDate.isSame(answerDate, "day"),
	);
	let prevAnswerResult = null as (typeof answerResults)[number] | null;
	if (filteredAnswerResults.length !== 0) {
		prevAnswerResult = filteredAnswerResults[filteredAnswerResults.length - 1];
	}
	// answerDateの回答履歴を取得
	const todayAnswerResult =
		answerResults.find((answerResult) =>
			answerResult.answerDate.isSame(answerDate, "day"),
		) ?? null;

	// prevAnswerResultに対するreviewPlanのnextDateを取得
	let prevReviewPlan = null;
	if (prevAnswerResult !== null) {
		prevReviewPlan = await localStorageService.getReviewPlanByAnswerResultId(
			prevAnswerResult.id,
		);
	}

	// 次の復習予定日の計算
	console.log(
		`calcNextReviewDate: ${answerDate.format("YYYY-MM-DD")} ${prevAnswerResult?.answerDate.format("YYYY-MM-DD")} ${prevReviewPlan?.nextDate.format("YYYY-MM-DD")} ${result}`,
	);
	const nextReviewDate = calcNextReviewDate(
		answerDate,
		prevAnswerResult?.answerDate ?? null,
		prevReviewPlan?.nextDate ?? null,
		result,
	);
	console.log(`nextReviewDate: ${nextReviewDate?.format("YYYY-MM-DD")}`);

	// 本日分のanswerResultの登録・更新
	const upsertedAnswerResultId = await localStorageService.upsertAnswerResult(
		todayAnswerResult?.id ?? null,
		questionId,
		setId,
		answerDate,
		result,
	);

	// 今日以前の最新のreviewPlanの更新
	if (prevAnswerResult && prevReviewPlan) {
		await localStorageService.upsertReviewPlan(
			prevAnswerResult.id,
			prevReviewPlan.nextDate,
			true,
		);
	}
	// 今日のreviewPlanの登録・更新
	await localStorageService.upsertReviewPlan(
		upsertedAnswerResultId,
		nextReviewDate,
		false,
	);

	// 今日以前のanswerResultが1つまでになるよう、古いreviewPlanを削除
	if (filteredAnswerResults.length >= 2) {
		for (let i = filteredAnswerResults.length - 2; i >= 0; i--) {
			const reviewPlan =
				await localStorageService.getReviewPlanByAnswerResultId(
					filteredAnswerResults[i].id,
				);
			if (reviewPlan) {
				await localStorageService.deleteReviewPlan(reviewPlan.id);
			}
		}
	}

	return upsertedAnswerResultId;
}
