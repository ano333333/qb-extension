import { test, expect } from "vitest";
import { calcNextReviewDate } from "../../src/logics/calcNextReviewDate";
import { AnswerResultEnum } from "../../src/logics/answerResultEnum";
import dayjs from "dayjs";
import ja from "dayjs/locale/ja";

test("calcNextReviewDate", () => {
	dayjs.locale(ja);

	/**
	 * 初めての回答の場合
	 * 新しい日付、前回回答日付、復習予定日、回答結果 => 次の復習日
	 * - "2024-12-07", null, null, - => "2024-12-08"
	 * - "2024-12-07", null, null, × => "2024-12-08"
	 * - "2024-12-07", null, null, 難 => "2024-12-09"
	 * - "2024-12-07", null, null, 正 => "2024-12-10"
	 * - "2024-12-07", null, null, 易 => "2024-12-11"
	 */
	expect(
		calcNextReviewDate(
			dayjs("2024-12-07"),
			null,
			null,
			AnswerResultEnum.None,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-08");
	expect(
		calcNextReviewDate(
			dayjs("2024-12-07"),
			null,
			null,
			AnswerResultEnum.Wrong,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-08");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-07"),
			null,
			null,
			AnswerResultEnum.Difficult,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-09");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-07"),
			null,
			null,
			AnswerResultEnum.Correct,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-10");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-07"),
			null,
			null,
			AnswerResultEnum.Easy,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-11");

	/**
	 * 今日が復習予定日以上の場合
	 * 新しい日付、前回回答日付、復習予定日、回答結果 => 次の復習日
	 * - "2024-12-10", "2024-12-07", "2024-12-10", - => "2024-12-11"
	 * - "2024-12-12", "2024-12-07", "2024-12-10", - => "2024-12-13"
	 * - "2024-12-10", "2024-12-07", "2024-12-10", × => "2024-12-11"
	 * - "2024-12-12", "2024-12-07", "2024-12-10", × => "2024-12-13"
	 * - "2024-12-10", "2024-12-07", "2024-12-10", 難 => "2024-12-13"
	 * - "2024-12-12", "2024-12-07", "2024-12-10", 難 => "2024-12-17"
	 * - "2024-12-10", "2024-12-07", "2024-12-10", 正 => "2024-12-14"
	 * - "2024-12-12", "2024-12-07", "2024-12-10", 正 => "2024-12-19"
	 * - "2024-12-10", "2024-12-07", "2024-12-10", 易 => "2024-12-16"
	 * - "2024-12-12", "2024-12-07", "2024-12-10", 易 => "2024-12-22"
	 */
	expect(
		calcNextReviewDate(
			dayjs("2024-12-10"),
			dayjs("2024-12-07"),
			dayjs("2024-12-10"),
			AnswerResultEnum.None,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-11");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-12"),
			dayjs("2024-12-07"),
			dayjs("2024-12-10"),
			AnswerResultEnum.None,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-13");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-10"),
			dayjs("2024-12-07"),
			dayjs("2024-12-10"),
			AnswerResultEnum.Wrong,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-11");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-12"),
			dayjs("2024-12-07"),
			dayjs("2024-12-10"),
			AnswerResultEnum.Wrong,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-13");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-10"),
			dayjs("2024-12-07"),
			dayjs("2024-12-10"),
			AnswerResultEnum.Difficult,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-13");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-12"),
			dayjs("2024-12-07"),
			dayjs("2024-12-10"),
			AnswerResultEnum.Difficult,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-17");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-10"),
			dayjs("2024-12-07"),
			dayjs("2024-12-10"),
			AnswerResultEnum.Correct,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-14");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-12"),
			dayjs("2024-12-07"),
			dayjs("2024-12-10"),
			AnswerResultEnum.Correct,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-19");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-10"),
			dayjs("2024-12-07"),
			dayjs("2024-12-10"),
			AnswerResultEnum.Easy,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-16");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-12"),
			dayjs("2024-12-07"),
			dayjs("2024-12-10"),
			AnswerResultEnum.Easy,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-22");

	/**
	 * 今日が復習予定日未満の場合
	 * 新しい日付、前回回答日付、復習予定日、回答結果 => 次の復習日
	 * - "2024-12-10", "2024-12-07", "2024-12-12", - => "2024-12-11"
	 * - "2024-12-10", "2024-12-07", "2024-12-12", × => "2024-12-11"
	 * - "2024-12-10", "2024-12-07", "2024-12-12", 難 => "2024-12-15"
	 * - "2024-12-10", "2024-12-07", "2024-12-12", 正 => "2024-12-15"
	 * - "2024-12-10", "2024-12-07", "2024-12-12", 易 => "2024-12-15"
	 */
	expect(
		calcNextReviewDate(
			dayjs("2024-12-10"),
			dayjs("2024-12-07"),
			dayjs("2024-12-12"),
			AnswerResultEnum.None,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-11");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-10"),
			dayjs("2024-12-07"),
			dayjs("2024-12-12"),
			AnswerResultEnum.Wrong,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-11");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-10"),
			dayjs("2024-12-07"),
			dayjs("2024-12-12"),
			AnswerResultEnum.Difficult,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-15");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-10"),
			dayjs("2024-12-07"),
			dayjs("2024-12-12"),
			AnswerResultEnum.Correct,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-15");

	expect(
		calcNextReviewDate(
			dayjs("2024-12-10"),
			dayjs("2024-12-07"),
			dayjs("2024-12-12"),
			AnswerResultEnum.Easy,
		).format("YYYY-MM-DD"),
	).toBe("2024-12-15");
});
