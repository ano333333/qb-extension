import type { Dayjs } from "dayjs";
import type { LocalStorageService } from "../services/localStorageService/localStorageService";
import type { AnswerResultEnum } from "../logics/answerResultEnum";
import { calcNextReviewDate } from "../logics/calcNextReviewDate";

export async function upsertAnswerResultAndReviewPlan(
	localStorageService: LocalStorageService,
	questionId: string,
	setId: string,
	answerDate: Dayjs,
	result: AnswerResultEnum,
) {
	let answerResults =
		await localStorageService.getAnswerResultsByQuestionId(questionId);
	// 本日分の記録があれば更新
	const todayAnswerResultId =
		answerResults.find((answerResult) =>
			answerResult.answerDate.isSame(answerDate, "day"),
		)?.id ?? null;
	const answerResultId = await localStorageService.upsertAnswerResult(
		todayAnswerResultId,
		questionId,
		setId,
		answerDate,
		result,
	);

	// 今日以前の問題回答履歴から、最後の回答日を取得
	answerResults = answerResults.filter(
		(answerResult) => !answerResult.answerDate.isSame(answerDate, "day"),
	);
	let prevDate = null as Dayjs | null;
	if (answerResults.length !== 0) {
		prevDate = answerResults[answerResults.length - 1].answerDate;
	}

	// 元々の復習予定日を取得
	const reviewPlan =
		await localStorageService.getReviewPlanByAnswerResultId(answerResultId);
	const reviewPlanDate = reviewPlan?.nextDate ?? null;
	const nextReviewDate = calcNextReviewDate(
		answerDate,
		reviewPlanDate,
		prevDate,
		result,
	);

	// 復習予定を登録・更新
	await localStorageService.upsertReviewPlan(answerResultId, nextReviewDate);
}
