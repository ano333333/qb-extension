import { describe, it, expect, beforeEach } from "vitest";
import { MockLocalStorage } from "../adapters/localStorage/mockLocalStorage";
import { LocalStorageService } from "../../src/services/localStorageService/localStorageService";
import { AnswerResultEnum } from "../../src/logics/answerResultEnum";
import dayjs from "dayjs";
import { upsertAnswerResultAndReviewPlan } from "../../src/usecases/upsertAnswerResultAndReviewPlan";

describe("upsertAnswerResultAndReviewPlan", () => {
	let localStorageAdapter: MockLocalStorage;
	let localStorageService: LocalStorageService;
	let answerResultId114C01_0: number;
	let answerResultId114C01_1: number;
	let answerResultId114C01_2: number;
	let answerResultId114C01_3: number;
	let answerResultId114C02_0: number;
	let answerResultId114C02_1: number;

	beforeEach(async () => {
		localStorageAdapter = new MockLocalStorage({});
		localStorageService = new LocalStorageService(localStorageAdapter);
		await localStorageService.validateVersion();
		answerResultId114C01_0 = await localStorageService.upsertAnswerResult(
			null,
			"114C01",
			"114C01",
			dayjs("2024-12-07"),
			AnswerResultEnum.Wrong,
		);
		answerResultId114C01_1 = await localStorageService.upsertAnswerResult(
			null,
			"114C01",
			"114C01",
			dayjs("2024-12-08"),
			AnswerResultEnum.Wrong,
		);
		answerResultId114C01_2 = await localStorageService.upsertAnswerResult(
			null,
			"114C01",
			"114C01",
			dayjs("2024-12-09"),
			AnswerResultEnum.Wrong,
		);
		answerResultId114C01_3 = await localStorageService.upsertAnswerResult(
			null,
			"114C01",
			"114C01",
			dayjs("2024-12-10"),
			AnswerResultEnum.Correct,
		);
		answerResultId114C02_0 = await localStorageService.upsertAnswerResult(
			null,
			"114C02",
			"114C02",
			dayjs("2024-12-10"),
			AnswerResultEnum.Difficult,
		);
		answerResultId114C02_1 = await localStorageService.upsertAnswerResult(
			null,
			"114C02",
			"114C02",
			dayjs("2024-12-12"),
			AnswerResultEnum.Easy,
		);
		await localStorageService.upsertReviewPlan(
			answerResultId114C01_0,
			dayjs("2024-12-08"),
			true,
		);
		await localStorageService.upsertReviewPlan(
			answerResultId114C01_1,
			dayjs("2024-12-09"),
			true,
		);
		await localStorageService.upsertReviewPlan(
			answerResultId114C01_2,
			dayjs("2024-12-10"),
			true,
		);
		await localStorageService.upsertReviewPlan(
			answerResultId114C01_3,
			dayjs("2024-12-13"),
			false,
		);
		await localStorageService.upsertReviewPlan(
			answerResultId114C02_0,
			dayjs("2024-12-12"),
			true,
		);
		await localStorageService.upsertReviewPlan(
			answerResultId114C02_1,
			dayjs("2024-12-16"),
			false,
		);
	});

	/**
	 * テスト項目:
	 * 1. 日付"2024-12-08"、問題ID"114C03"(新規問題)、回答結果AnswerResultEnum.Easyに対しupsertAnswerResultAndReviewPlanを実行し、
	 *   - 実行前後の問題ID"114C03"に対するgetAnswerResultsByQuestionIdの返り値を比較
	 *   - 増加したanswerResultのIDがupsertAnswerResultの返り値であることを確認
	 *   - 増加したanswerResultの問題IDに対しgetReviewPlanByAnswerResultIdを実行し、次回復習日が"2024-12-12"であること、completedがfalseであることを確認
	 * 2. 日付"2024-12-14"、問題ID"114C01"(既存問題)、回答結果AnswerResultEnum.Easyに対しupsertAnswerResultAndReviewPlanを実行し
	 *   - 実行前後の問題ID"114C01"に対するgetAnswerResultsByQuestionIdの返り値を比較
	 *   - 増加したanswerResultのIDがupsertAnswerResultの返り値に等しいことを確認
	 *   - 増加したanswerResultの問題IDに対しgetReviewPlanByAnswerResultIdを実行し、次回復習日が"2024-12-22"であること、completedがfalseであることを確認
	 *   - IDがanswerResultId114C01_0、_1、_2であるanswerResultに対応するreviewPlanが存在しないことを確認
	 *   - IDがanswerResultId114C01_3であるanswerResultに対応するreviewPlanのcompletedがtrueであることを確認
	 * 3. 日付"2024-12-18"、問題ID"114C02"(既存問題)、回答結果AnswerResultEnum.Easyに対しupsertAnswerResultAndReviewPlanを実行し
	 *   - 実行前後の問題ID"114C02"に対するgetAnswerResultsByQuestionIdの返り値を比較
	 *   - 増加したanswerResultのIDがupsertAnswerResultの返り値とanswerResultId114C02_1に等しいことを確認
	 *   - 増加したanswerResultの問題IDに対しgetReviewPlanByAnswerResultIdを実行し、次回復習日が"2024-12-30"であること、completedがfalseであることを確認
	 *   - IDがanswerResultId114C02_0であるanswerResultに対応するreviewPlanが存在しないことを確認
	 *   - IDがanswerResultId114C02_1であるanswerResultに対応するreviewPlanのcompletedがtrueであることを確認
	 * 4. 日付"2024-12-12"、問題ID"114C02"(既存問題)、回答結果AnswerResultEnum.Correctに対しupsertAnswerResultAndReviewPlanを実行し
	 *   - 実行前後の問題ID"114C02"に対するgetAnswerResultsByQuestionIdの返り値を比較
	 *   - upsertAnswerResultの返り値とanswerResultId114C02_1が等しいことを確認
	 *   - IDがanswerResultId114C02_0であるanswerResultに対応するreviewPlanのcompletedがtrueであることを確認
	 *   - 返り値に対しgetReviewPlanByAnswerResultIdを実行し、次回復習日が"2024-12-15"であること、completedがfalseであることを確認
	 */
	it("1", async () => {
		const answerResultsBefore =
			await localStorageService.getAnswerResultsByQuestionId("114C03");
		expect(answerResultsBefore.length).toBe(0);
		const returnedId = await upsertAnswerResultAndReviewPlan(
			localStorageService,
			"114C03",
			"114C03",
			dayjs("2024-12-08"),
			AnswerResultEnum.Easy,
		);
		const answerResultsAfter =
			await localStorageService.getAnswerResultsByQuestionId("114C03");
		expect(answerResultsAfter.length).toBe(1);
		const newAnswerResult = answerResultsAfter[answerResultsAfter.length - 1];
		expect(newAnswerResult.id).toBe(returnedId);
		const reviewPlan = await localStorageService.getReviewPlanByAnswerResultId(
			newAnswerResult.id,
		);
		expect(reviewPlan?.nextDate.format("YYYY-MM-DD")).toBe("2024-12-12");
		expect(reviewPlan?.completed).toBe(false);
	});
	it("2", async () => {
		const answerResultsBefore =
			await localStorageService.getAnswerResultsByQuestionId("114C01");
		expect(answerResultsBefore.length).toBe(4);
		const returnedId = await upsertAnswerResultAndReviewPlan(
			localStorageService,
			"114C01",
			"114C01",
			dayjs("2024-12-14"),
			AnswerResultEnum.Easy,
		);
		const answerResultsAfter =
			await localStorageService.getAnswerResultsByQuestionId("114C01");
		expect(answerResultsAfter.length).toBe(5);
		const newAnswerResult = answerResultsAfter[answerResultsAfter.length - 1];
		expect(newAnswerResult.id).toBe(returnedId);
		expect(
			await localStorageService.getReviewPlanByAnswerResultId(
				answerResultId114C01_0,
			),
		).toBeNull();
		expect(
			await localStorageService.getReviewPlanByAnswerResultId(
				answerResultId114C01_1,
			),
		).toBeNull();
		expect(
			await localStorageService.getReviewPlanByAnswerResultId(
				answerResultId114C01_2,
			),
		).toBeNull();
		const reviewPlan114C01_3 =
			await localStorageService.getReviewPlanByAnswerResultId(
				answerResultId114C01_3,
			);
		expect(reviewPlan114C01_3?.completed).toBe(true);
		const reviewPlan = await localStorageService.getReviewPlanByAnswerResultId(
			newAnswerResult.id,
		);
		expect(reviewPlan?.nextDate.format("YYYY-MM-DD")).toBe("2024-12-22");
		expect(reviewPlan?.completed).toBe(false);
	});
	it("3", async () => {
		const answerResultsBefore =
			await localStorageService.getAnswerResultsByQuestionId("114C02");
		expect(answerResultsBefore.length).toBe(2);
		const returnedId = await upsertAnswerResultAndReviewPlan(
			localStorageService,
			"114C02",
			"114C02",
			dayjs("2024-12-18"),
			AnswerResultEnum.Easy,
		);
		const answerResultsAfter =
			await localStorageService.getAnswerResultsByQuestionId("114C02");
		expect(answerResultsAfter.length).toBe(3);
		const newAnswerResult = answerResultsAfter[answerResultsAfter.length - 1];
		expect(newAnswerResult.id).toBe(returnedId);
		expect(
			await localStorageService.getReviewPlanByAnswerResultId(
				answerResultId114C02_0,
			),
		).toBeNull();
		const reviewPlan114C02_1 =
			await localStorageService.getReviewPlanByAnswerResultId(
				answerResultId114C02_1,
			);
		const reviewPlan = await localStorageService.getReviewPlanByAnswerResultId(
			newAnswerResult.id,
		);
		expect(reviewPlan?.nextDate.format("YYYY-MM-DD")).toBe("2024-12-30");
		expect(reviewPlan?.completed).toBe(false);
		expect(reviewPlan114C02_1?.completed).toBe(true);
	});
	it("4", async () => {
		const answerResultsBefore =
			await localStorageService.getAnswerResultsByQuestionId("114C02");
		expect(answerResultsBefore.length).toBe(2);
		const returnedId = await upsertAnswerResultAndReviewPlan(
			localStorageService,
			"114C02",
			"114C02",
			dayjs("2024-12-12"),
			AnswerResultEnum.Correct,
		);
		const answerResultsAfter =
			await localStorageService.getAnswerResultsByQuestionId("114C02");
		expect(answerResultsAfter.length).toBe(2);
		expect(returnedId).toBe(answerResultId114C02_1);
		const reviewPlan114C02_0 =
			await localStorageService.getReviewPlanByAnswerResultId(
				answerResultId114C02_0,
			);
		expect(reviewPlan114C02_0?.completed).toBe(true);
		const reviewPlan =
			await localStorageService.getReviewPlanByAnswerResultId(returnedId);
		expect(reviewPlan?.nextDate.format("YYYY-MM-DD")).toBe("2024-12-15");
		expect(reviewPlan?.completed).toBe(false);
	});
});
