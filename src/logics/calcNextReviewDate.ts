import type { Dayjs } from "dayjs";
import { AnswerResultEnum } from "./answerResultEnum";

/**
 * 新しい日付、前回回答日付、復習予定日、回答結果から次の復習日を計算する。
 * 計算ルールは、草案.mdの「## 問題の復習ルール」を参照。
 * @param date 新しい日付
 * @param prevDate 前回回答日付(初めての回答の場合nullを指定)
 * @param reviewDate 復習予定日(初めての回答の場合nullを指定)
 * @param answerResult 回答結果
 * @returns 次の復習日
 */
export function calcNextReviewDate(
	date: Dayjs,
	prevDate: Dayjs | null,
	reviewDate: Dayjs | null,
	answerResult: AnswerResultEnum,
) {
	if (prevDate === null || reviewDate === null) {
		switch (answerResult) {
			case AnswerResultEnum.None:
			case AnswerResultEnum.Wrong:
				return date.add(1, "day");
			case AnswerResultEnum.Difficult:
				return date.add(2, "day");
			case AnswerResultEnum.Correct:
				return date.add(3, "day");
			case AnswerResultEnum.Easy:
				return date.add(4, "day");
		}
	}
	if (!date.isBefore(reviewDate)) {
		const daysDiff = date.diff(prevDate, "day");
		switch (answerResult) {
			case AnswerResultEnum.None:
			case AnswerResultEnum.Wrong:
				return date.add(1, "day");
			case AnswerResultEnum.Difficult:
				return date.add(daysDiff, "day");
			case AnswerResultEnum.Correct:
				return date.add(Math.ceil(daysDiff * 1.5), "day");
			case AnswerResultEnum.Easy:
				return date.add(daysDiff * 3, "day");
		}
	}
	const daysDiff = date.diff(prevDate, "day");
	switch (answerResult) {
		case AnswerResultEnum.None:
		case AnswerResultEnum.Wrong:
			return date.add(1, "day");
		case AnswerResultEnum.Difficult:
		case AnswerResultEnum.Correct:
		case AnswerResultEnum.Easy:
			return reviewDate.add(daysDiff, "day");
	}
}
