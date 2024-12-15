import { MockLocalStorage } from "../../adapters/localStorage/mockLocalStorage";
import { LocalStorageService } from "../../../src/services/localStorageService/localStorageService";
import { beforeEach, describe } from "vitest";
import { z } from "zod";
import { AnswerResultEnum } from "../../../src/logics/answerResultEnum";
import { it } from "vitest";
import dayjs, { type Dayjs } from "dayjs";
import { expect } from "vitest";
import { faker } from "@faker-js/faker";
describe("LocalStorageService", () => {
	let localStorageAdapter: MockLocalStorage;
	let localStorageService: LocalStorageService;

	const validateMockLocalStorage = () => {
		localStorageAdapter.validateData("version", z.literal(1));
		localStorageAdapter.validateData(
			"answerResults",
			z.array(
				z.object({
					id: z.number(),
					questionId: z.string(),
					setId: z.string(),
					answerDate: z.string(),
					result: z.nativeEnum(AnswerResultEnum),
				}),
			),
		);
		localStorageAdapter.validateData("answerResultsNextId", z.number());
		localStorageAdapter.validateData(
			"reviewPlans",
			z.array(
				z.object({
					id: z.number(),
					answerResultId: z.number(),
					nextDate: z.string(),
					completed: z.boolean(),
				}),
			),
		);
		localStorageAdapter.validateData("reviewPlansNextId", z.number());
	};

	beforeEach(async () => {
		localStorageAdapter = new MockLocalStorage();
		localStorageService = new LocalStorageService(localStorageAdapter);
		await localStorageService.validateVersion();
	});

	it("validateVersion", async () => {
		console.log(localStorageAdapter._data);
		validateMockLocalStorage();
	});

	it("getAnswerResultsByQuestionId", async () => {
		await localStorageAdapter.set("answerResults", [
			{
				id: 0,
				questionId: "114C01",
				setId: "114C01",
				answerDate: "2024-12-07",
				result: AnswerResultEnum.Correct,
			},
			{
				id: 1,
				questionId: "114C02",
				setId: "114C02",
				answerDate: "2024-12-08",
				result: AnswerResultEnum.Wrong,
			},
			{
				id: 2,
				questionId: "114C02",
				setId: "114C02",
				answerDate: "2024-12-09",
				result: AnswerResultEnum.Correct,
			},
			{
				id: 3,
				questionId: "114C03",
				setId: "114C03",
				answerDate: "2024-12-09",
				result: AnswerResultEnum.Wrong,
			},
			{
				id: 4,
				questionId: "114C03",
				setId: "114C03",
				answerDate: "2024-12-10",
				result: AnswerResultEnum.Correct,
			},
		]);
		await localStorageAdapter.set("answerResultsNextId", 5);
		const answerResults114C02 =
			await localStorageService.getAnswerResultsByQuestionId("114C02");
		validateMockLocalStorage();
		expect(answerResults114C02).toEqual([
			{
				id: 1,
				questionId: "114C02",
				setId: "114C02",
				answerDate: dayjs("2024-12-08"),
				result: AnswerResultEnum.Wrong,
			},
			{
				id: 2,
				questionId: "114C02",
				setId: "114C02",
				answerDate: dayjs("2024-12-09"),
				result: AnswerResultEnum.Correct,
			},
		]);
		const answerResults114C03 =
			await localStorageService.getAnswerResultsByQuestionId("114C03");
		validateMockLocalStorage();
		expect(answerResults114C03).toEqual([
			{
				id: 3,
				questionId: "114C03",
				setId: "114C03",
				answerDate: dayjs("2024-12-09"),
				result: AnswerResultEnum.Wrong,
			},
			{
				id: 4,
				questionId: "114C03",
				setId: "114C03",
				answerDate: dayjs("2024-12-10"),
				result: AnswerResultEnum.Correct,
			},
		]);
		const answerResults114C04 =
			await localStorageService.getAnswerResultsByQuestionId("114C04");
		validateMockLocalStorage();
		expect(answerResults114C04).toEqual([]);
	});

	it("upsertAnswerResult", async () => {
		await localStorageAdapter.set("answerResults", [
			{
				id: 0,
				questionId: "114C01",
				setId: "114C01",
				answerDate: "2024-12-07",
				result: AnswerResultEnum.Correct,
			},
			{
				id: 1,
				questionId: "114C02",
				setId: "114C02",
				answerDate: "2024-12-08",
				result: AnswerResultEnum.Easy,
			},
		]);
		await localStorageAdapter.set("answerResultsNextId", 2);
		await localStorageService.upsertAnswerResult(
			null,
			"114C03",
			"114C03",
			dayjs("2024-12-09"),
			AnswerResultEnum.Correct,
		);
		validateMockLocalStorage();
		expect((await localStorageAdapter.get("answerResults"))?.[2]).toEqual({
			id: 2,
			questionId: "114C03",
			setId: "114C03",
			answerDate: "2024-12-09",
			result: AnswerResultEnum.Correct,
		});
		expect(await localStorageAdapter.get("answerResultsNextId")).toBe(3);
		await localStorageService.upsertAnswerResult(
			1,
			"114C02",
			"114C02",
			dayjs("2024-12-10"),
			AnswerResultEnum.Correct,
		);
		validateMockLocalStorage();
		expect((await localStorageAdapter.get("answerResults"))?.[1]).toEqual({
			id: 1,
			questionId: "114C02",
			setId: "114C02",
			answerDate: "2024-12-10",
			result: AnswerResultEnum.Correct,
		});
		expect(async () => {
			await localStorageService.upsertAnswerResult(
				3,
				"114C03",
				"114C03",
				dayjs("2024-12-11"),
				AnswerResultEnum.Correct,
			);
		}).rejects.toThrow(Error);
	});

	it("deleteReviewPlan", async () => {
		const answerResults = [
			{
				id: 0,
				questionId: "114C01",
				setId: "114C01",
				answerDate: "2024-12-07",
				result: AnswerResultEnum.Correct,
			},
			{
				id: 1,
				questionId: "114C02",
				setId: "114C02",
				answerDate: "2024-12-08",
				result: AnswerResultEnum.Wrong,
			},
			{
				id: 2,
				questionId: "114C02",
				setId: "114C02",
				answerDate: "2024-12-09",
				result: AnswerResultEnum.Correct,
			},
			{
				id: 3,
				questionId: "114C03",
				setId: "114C03",
				answerDate: "2024-12-09",
				result: AnswerResultEnum.Wrong,
			},
			{
				id: 4,
				questionId: "114C03",
				setId: "114C03",
				answerDate: "2024-12-10",
				result: AnswerResultEnum.Correct,
			},
		];
		await localStorageAdapter.set("answerResults", answerResults);
		await localStorageAdapter.set("answerResultsNextId", 5);
		const reviewPlans = [
			{
				id: 0,
				answerResultId: 0,
				nextDate: "2024-12-09",
				completed: false,
			},
			{
				id: 1,
				answerResultId: 1,
				nextDate: "2024-12-10",
				completed: false,
			},
			{
				id: 2,
				answerResultId: 4,
				nextDate: "2024-12-11",
				completed: false,
			},
		];
		await localStorageAdapter.set("reviewPlans", reviewPlans);
		await localStorageAdapter.set("reviewPlansNextId", 3);
		await localStorageService.deleteReviewPlan(0);
		validateMockLocalStorage();
		expect(await localStorageAdapter.get("answerResults")).toEqual(
			answerResults,
		);
		expect(await localStorageAdapter.get("answerResultsNextId")).toBe(5);
		const filteredReviewPlans = reviewPlans.filter(
			(reviewPlan) => reviewPlan.id !== 0,
		);
		expect(await localStorageAdapter.get("reviewPlans")).toEqual(
			filteredReviewPlans,
		);
		expect(await localStorageAdapter.get("reviewPlansNextId")).toBe(3);
		await localStorageService.deleteReviewPlan(3);
		validateMockLocalStorage();
		expect(await localStorageAdapter.get("answerResults")).toEqual(
			answerResults,
		);
		expect(await localStorageAdapter.get("answerResultsNextId")).toBe(5);
		expect(await localStorageAdapter.get("reviewPlans")).toEqual(
			filteredReviewPlans,
		);
		expect(await localStorageAdapter.get("reviewPlansNextId")).toBe(3);
	});

	it("getReviewPlanByAnswerResultId", async () => {
		await localStorageAdapter.set("reviewPlans", [
			{
				id: 0,
				answerResultId: 0,
				nextDate: "2024-12-09",
				completed: false,
			},
			{
				id: 1,
				answerResultId: 2,
				nextDate: "2024-12-10",
				completed: false,
			},
			{
				id: 2,
				answerResultId: 4,
				nextDate: "2024-12-11",
				completed: false,
			},
		]);
		await localStorageAdapter.set("reviewPlansNextId", 3);
		const reviewPlan0 =
			await localStorageService.getReviewPlanByAnswerResultId(0);
		validateMockLocalStorage();
		expect(reviewPlan0).toEqual({
			id: 0,
			answerResultId: 0,
			nextDate: dayjs("2024-12-09"),
			completed: false,
		});
		const reviewPlan1 =
			await localStorageService.getReviewPlanByAnswerResultId(1);
		validateMockLocalStorage();
		expect(reviewPlan1).toBeNull();
	});

	it("upsertReviewPlan", async () => {
		await localStorageAdapter.set("reviewPlans", [
			{
				id: 0,
				answerResultId: 0,
				nextDate: "2024-12-09",
				completed: false,
			},
			{
				id: 1,
				answerResultId: 2,
				nextDate: "2024-12-10",
				completed: false,
			},
			{
				id: 2,
				answerResultId: 4,
				nextDate: "2024-12-11",
				completed: false,
			},
		]);
		await localStorageAdapter.set("reviewPlansNextId", 3);
		await localStorageService.upsertReviewPlan(3, dayjs("2024-12-12"), false);
		validateMockLocalStorage();
		expect((await localStorageAdapter.get("reviewPlans"))?.[3]).toEqual({
			id: 3,
			answerResultId: 3,
			nextDate: "2024-12-12",
			completed: false,
		});
		expect(await localStorageAdapter.get("reviewPlansNextId")).toBe(4);
		await localStorageService.upsertReviewPlan(2, dayjs("2024-12-13"), true);
		validateMockLocalStorage();
		expect((await localStorageAdapter.get("reviewPlans"))?.[1]).toEqual({
			id: 1,
			answerResultId: 2,
			nextDate: "2024-12-13",
			completed: true,
		});
	});

	it("getUncompletedReviewPlans", async () => {
		const merged = new Array<{
			id: number;
			answerResultId: number;
			nextDate: Dayjs;
			completed: boolean;
			answerResult: {
				id: number;
				questionId: string;
				setId: string;
				answerDate: Dayjs;
				result: AnswerResultEnum;
			};
		}>(100);
		for (let i = 0; i < 100; i++) {
			const questionId = faker.string.alphanumeric({
				length: { min: 5, max: 5 },
				casing: "upper",
			});
			merged[i] = {
				id: i,
				answerResultId: i,
				nextDate: dayjs(
					faker.date
						.soon({
							days: 14,
						})
						.toDateString(),
				),
				completed: faker.datatype.boolean(),
				answerResult: {
					id: i,
					questionId,
					setId: questionId,
					answerDate: dayjs(
						faker.date
							.recent({
								days: 14,
							})
							.toDateString(),
					),
					result: faker.helpers.arrayElement(Object.values(AnswerResultEnum)),
				},
			};
		}
		await localStorageAdapter.set(
			"answerResults",
			merged.map((merged) => ({
				...merged.answerResult,
				answerDate: merged.answerResult.answerDate.format("YYYY-MM-DD"),
			})),
		);
		await localStorageAdapter.set("answerResultsNextId", 100);
		await localStorageAdapter.set(
			"reviewPlans",
			merged.map((merged) => ({
				id: merged.id,
				answerResultId: merged.answerResultId,
				nextDate: merged.nextDate.format("YYYY-MM-DD"),
				completed: merged.completed,
			})),
		);
		await localStorageAdapter.set("reviewPlansNextId", 100);

		const untilOrEqualTo = dayjs(faker.date.soon());
		const uncompletedReviewPlans =
			await localStorageService.getUncompletedReviewPlans(untilOrEqualTo);
		validateMockLocalStorage();

		// uncompletedReviewPlansのnextDateは昇順になっている
		for (let i = 0; i < uncompletedReviewPlans.length - 1; i++) {
			expect(
				!dayjs(uncompletedReviewPlans[i].nextDate).isAfter(
					uncompletedReviewPlans[i + 1].nextDate,
				),
			).toBe(true);
		}

		// mergedを手動でフィルターしquestionId昇順・answerDate昇順にソートしたものと、
		// uncompletedReviewPlansをquestionId昇順・answerDate昇順にソートしたものを比較
		const filteredMerged = merged
			.filter((merged) => !merged.completed)
			.filter(
				(merged) => !dayjs(merged.nextDate).isAfter(untilOrEqualTo, "day"),
			)
			.sort((a, b) => {
				if (a.answerResult.questionId !== b.answerResult.questionId) {
					return a.answerResult.questionId.localeCompare(
						b.answerResult.questionId,
					);
				}
				return a.answerResult.answerDate.diff(b.answerResult.answerDate);
			});
		const filteredUncompletedReviewPlans = uncompletedReviewPlans.sort(
			(a, b) => {
				if (a.answerResult.questionId !== b.answerResult.questionId) {
					return a.answerResult.questionId.localeCompare(
						b.answerResult.questionId,
					);
				}
				return a.answerResult.answerDate.diff(b.answerResult.answerDate);
			},
		);
		expect(filteredMerged.length).toEqual(
			filteredUncompletedReviewPlans.length,
		);
	});
});
