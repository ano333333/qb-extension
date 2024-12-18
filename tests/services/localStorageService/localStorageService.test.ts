import { MockLocalStorage } from "../../adapters/localStorage/mockLocalStorage";
import { LocalStorageService } from "../../../src/services/localStorageService/localStorageService";
import { beforeEach, describe } from "vitest";
import { AnswerResultEnum } from "../../../src/logics/answerResultEnum";
import { it } from "vitest";
import dayjs from "dayjs";
import { expect } from "vitest";
import { faker } from "@faker-js/faker";
import {
	LocalStorageVer2Default,
	type LocalStorageVer2Schema,
} from "../../../src/services/localStorageService/ver2Schema";
import type { ReviewPlanType } from "../../../src/logics/reviewPlanType";
import type { AnswerResultType } from "../../../src/logics/answerResultType";

describe("LocalStorageService", () => {
	let localStorageAdapter: MockLocalStorage;
	let localStorageService: LocalStorageService;

	const setVer2 = async (ver2: LocalStorageVer2Schema) => {
		await localStorageAdapter.set("version", 2);
		await localStorageAdapter.set("answerResults", ver2.answerResults);
		await localStorageAdapter.set(
			"answerResultsNextId",
			ver2.answerResultsNextId,
		);
		await localStorageAdapter.set("reviewPlans", ver2.reviewPlans);
		await localStorageAdapter.set("reviewPlansNextId", ver2.reviewPlansNextId);
	};

	const expectLocalStorageToBe = async (ver2: LocalStorageVer2Schema) => {
		expect(await localStorageAdapter.get("version")).toBe(2);
		expect(await localStorageAdapter.get("answerResults")).toEqual(
			ver2.answerResults,
		);
		expect(await localStorageAdapter.get("answerResultsNextId")).toBe(
			ver2.answerResultsNextId,
		);
		expect(await localStorageAdapter.get("reviewPlans")).toEqual(
			ver2.reviewPlans,
		);
		expect(await localStorageAdapter.get("reviewPlansNextId")).toBe(
			ver2.reviewPlansNextId,
		);
	};

	beforeEach(() => {
		localStorageAdapter = new MockLocalStorage();
		localStorageService = new LocalStorageService(localStorageAdapter);
	});

	describe("validateVersion", () => {
		/**
		 * テスト項目:
		 * 1. localStorageが空の場合、LocalStorageVer2Defaultの値がセットされている
		 * 2. localStorageにver1のデータがある場合、ver2のデータに変換されている
		 */
		it("1", async () => {
			await localStorageService.validateVersion();
			await expectLocalStorageToBe(LocalStorageVer2Default);
		});
		it("2", async () => {
			const ver1 = {
				version: 1,
				answerResults: [
					{
						id: 0,
						questionId: "113C01",
						setId: "113C01",
						answerDate: "2024-12-15",
						result: AnswerResultEnum.Correct,
					},
					{
						id: 1,
						questionId: "114C02",
						setId: "114C02",
						answerDate: "2024-12-19",
						result: AnswerResultEnum.Easy,
					},
				],
				answerResultsNextId: 2,
				reviewPlans: [
					{
						id: 0,
						answerResultId: 0,
						nextDate: "2024-12-18",
						completed: true,
					},
					{
						id: 1,
						answerResultId: 1,
						nextDate: "2024-12-23",
						completed: false,
					},
				],
				reviewPlansNextId: 2,
			};
			for (const key in ver1) {
				await localStorageAdapter.set(key, ver1[key]);
			}
			await localStorageService.validateVersion();
			const ver2 = {
				version: 2,
				answerResults: [
					{
						i: 0,
						q: 0x113c01,
						s: 0x113c01,
						a: 20241215,
						r: AnswerResultEnum.Correct,
					},
					{
						i: 1,
						q: 0x114c02,
						s: 0x114c02,
						a: 20241219,
						r: AnswerResultEnum.Easy,
					},
				],
				answerResultsNextId: 2,
				reviewPlans: [
					{
						i: 0,
						a: 0,
						n: 20241218,
						c: 1,
					},
					{
						i: 1,
						a: 1,
						n: 20241223,
						c: 0,
					},
				],
				reviewPlansNextId: 2,
			};
			for (const key in ver2) {
				expect(await localStorageAdapter.get(key)).toEqual(
					ver2[key as keyof typeof ver2],
				);
			}
		});
	});

	describe("getAnswerResultsByQuestionId", () => {
		/**
		 * テスト項目:
		 * 1. questionIdに紐づくanswerResultが1つ存在する場合、正しい形式で返却される
		 * 2. questionIdに紐づくanswerResultが複数存在する場合、正しい形式で返却される
		 * 3. questionIdに紐づくanswerResultが存在しない場合、空の配列が返却される
		 */
		const ver2 = {
			version: 2 as const,
			answerResults: [
				{
					i: 0,
					q: 0x114c01,
					s: 0x114c01,
					a: 20241207,
					r: AnswerResultEnum.Correct,
				},
				{
					i: 1,
					q: 0x114c02,
					s: 0x114c02,
					a: 20241208,
					r: AnswerResultEnum.Wrong,
				},
				{
					i: 2,
					q: 0x114c02,
					s: 0x114c02,
					a: 20241209,
					r: AnswerResultEnum.Correct,
				},
				{
					i: 3,
					q: 0x114c03,
					s: 0x114c03,
					a: 20241209,
					r: AnswerResultEnum.Wrong,
				},
				{
					i: 4,
					q: 0x114c03,
					s: 0x114c03,
					a: 20241210,
					r: AnswerResultEnum.Correct,
				},
			],
			answerResultsNextId: 5,
			reviewPlans: [],
			reviewPlansNextId: 0,
		};
		beforeEach(async () => {
			await setVer2(ver2);
		});
		it("1", async () => {
			const answerResults114C01 =
				await localStorageService.getAnswerResultsByQuestionId("114C01");
			expect(answerResults114C01).toEqual([
				{
					id: 0,
					questionId: "114C01",
					setId: "114C01",
					answerDate: dayjs("2024-12-07"),
					result: AnswerResultEnum.Correct,
				},
			]);
			await expectLocalStorageToBe(ver2);
		});
		it("2", async () => {
			const answerResults114C02 =
				await localStorageService.getAnswerResultsByQuestionId("114C02");
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
			await expectLocalStorageToBe(ver2);
		});
		it("3", async () => {
			const answerResults114C04 =
				await localStorageService.getAnswerResultsByQuestionId("114C04");
			expect(answerResults114C04).toEqual([]);
			await expectLocalStorageToBe(ver2);
		});
	});

	describe("upsertAnswerResult", async () => {
		/**
		 * テスト項目:
		 * 1. idがnullの場合、answerResultsに新しい要素が追加され、answerResultsNextIdが1増加し、関数の返り値は2である。
		 * 2. 既存のidの場合、answerResultsの該当する要素が更新され、関数の返り値はidである。
		 * 3. nullでない存在しないidの場合、エラーがスローされる。local storageは更新されない。
		 */
		const ver2 = {
			version: 2 as const,
			answerResults: [
				{
					i: 0,
					q: 0x114c01,
					s: 0x114c01,
					a: 20241207,
					r: AnswerResultEnum.Correct,
				},
				{
					i: 1,
					q: 0x114c02,
					s: 0x114c02,
					a: 20241208,
					r: AnswerResultEnum.Wrong,
				},
			],
			answerResultsNextId: 2,
			reviewPlans: [],
			reviewPlansNextId: 0,
		};
		beforeEach(async () => {
			await setVer2(ver2);
		});
		it("1", async () => {
			const id = await localStorageService.upsertAnswerResult(
				null,
				"114C01",
				"114C01",
				dayjs("2024-12-07"),
				AnswerResultEnum.Correct,
			);
			await expectLocalStorageToBe({
				...ver2,
				answerResults: [
					...ver2.answerResults,
					{
						i: 2,
						q: 0x114c01,
						s: 0x114c01,
						a: 20241207,
						r: AnswerResultEnum.Correct,
					},
				],
				answerResultsNextId: ver2.answerResultsNextId + 1,
			});
			expect(id).toBe(2);
		});
		it("2", async () => {
			const id = await localStorageService.upsertAnswerResult(
				1,
				"114C03",
				"114C03",
				dayjs("2024-12-09"),
				AnswerResultEnum.Correct,
			);
			await expectLocalStorageToBe({
				...ver2,
				answerResults: [
					...ver2.answerResults.slice(0, 1),
					{
						i: 1,
						q: 0x114c03,
						s: 0x114c03,
						a: 20241209,
						r: AnswerResultEnum.Correct,
					},
				],
			});
			expect(id).toBe(1);
		});
		it("3", async () => {
			await expect(async () => {
				await localStorageService.upsertAnswerResult(
					3,
					"114C03",
					"114C03",
					dayjs("2024-12-11"),
					AnswerResultEnum.Correct,
				);
			}).rejects.toThrow(Error);
			await expectLocalStorageToBe(ver2);
		});
	});

	describe("deleteReviewPlan", async () => {
		/**
		 * テスト項目:
		 * 1. 既存のid(0)に対しdeleteReviewPlanを実行すると適切にreviewPlansのみが更新される
		 * 2. 既存のid(2)に対しdeleteReviewPlanを実行すると適切にreviewPlansのみが更新される
		 * 3. 存在しないid(3)に対しdeleteReviewPlanを実行してもlocal storageは更新されない
		 */
		const ver2 = {
			version: 2 as const,
			answerResults: [
				{
					i: 0,
					q: 0x114c01,
					s: 0x114c01,
					a: 20241207,
					r: AnswerResultEnum.Correct,
				},
				{
					i: 1,
					q: 0x114c02,
					s: 0x114c02,
					a: 20241208,
					r: AnswerResultEnum.Wrong,
				},
				{
					i: 2,
					q: 0x114c02,
					s: 0x114c02,
					a: 20241209,
					r: AnswerResultEnum.Correct,
				},
				{
					i: 3,
					q: 0x114c03,
					s: 0x114c03,
					a: 20241209,
					r: AnswerResultEnum.Wrong,
				},
				{
					i: 4,
					q: 0x114c03,
					s: 0x114c03,
					a: 20241210,
					r: AnswerResultEnum.Correct,
				},
			],
			answerResultsNextId: 5,
			reviewPlans: [
				{
					i: 0,
					a: 0,
					n: 20241209,
					c: 0,
				},
				{
					i: 1,
					a: 1,
					n: 20241210,
					c: 0,
				},
				{
					i: 2,
					a: 4,
					n: 20241211,
					c: 0,
				},
			],
			reviewPlansNextId: 3,
		};
		beforeEach(async () => {
			await setVer2(ver2);
		});
		it("1", async () => {
			await localStorageService.deleteReviewPlan(0);
			await expectLocalStorageToBe({
				...ver2,
				reviewPlans: [...ver2.reviewPlans.slice(1, 3)],
			});
		});
		it("2", async () => {
			await localStorageService.deleteReviewPlan(2);
			await expectLocalStorageToBe({
				...ver2,
				reviewPlans: [...ver2.reviewPlans.slice(0, 2)],
			});
		});
		it("3", async () => {
			await localStorageService.deleteReviewPlan(3);
			await expectLocalStorageToBe(ver2);
		});
	});

	describe("getReviewPlanByAnswerResultId", async () => {
		/**
		 * テスト項目:
		 * 1. answerResultId = 0に対しgetReviewPlanByAnswerResultIdを実行すると適切にreviewPlanが返却され、local storageは更新されない
		 * 2. answerResultId = 1に対しgetReviewPlanByAnswerResultIdを実行すると適切にreviewPlanが返却され、local storageは更新されない
		 * 3. answerResultId = 2に対しgetReviewPlanByAnswerResultIdを実行するとnullが返却され、local storageは更新されない
		 */
		const ver2 = {
			version: 2 as const,
			answerResults: [
				{
					i: 0,
					q: 0x114c01,
					s: 0x114c01,
					a: 20241207,
					r: AnswerResultEnum.Correct,
				},
				{
					i: 1,
					q: 0x114c02,
					s: 0x114c02,
					a: 20241208,
					r: AnswerResultEnum.Wrong,
				},
				{
					i: 2,
					q: 0x114c02,
					s: 0x114c02,
					a: 20241209,
					r: AnswerResultEnum.Correct,
				},
				{
					i: 3,
					q: 0x114c03,
					s: 0x114c03,
					a: 20241209,
					r: AnswerResultEnum.Wrong,
				},
				{
					i: 4,
					q: 0x114c03,
					s: 0x114c03,
					a: 20241210,
					r: AnswerResultEnum.Correct,
				},
			],
			answerResultsNextId: 5,
			reviewPlans: [
				{
					i: 0,
					a: 0,
					n: 20241209,
					c: 0,
				},
				{
					i: 1,
					a: 1,
					n: 20241210,
					c: 0,
				},
				{
					i: 2,
					a: 4,
					n: 20241211,
					c: 0,
				},
			],
			reviewPlansNextId: 3,
		};
		beforeEach(async () => {
			await setVer2(ver2);
		});
		it("1", async () => {
			const reviewPlan0 =
				await localStorageService.getReviewPlanByAnswerResultId(0);
			expect(reviewPlan0).toEqual({
				id: 0,
				answerResultId: 0,
				nextDate: dayjs("2024-12-09"),
				completed: false,
			});
			expectLocalStorageToBe(ver2);
		});
		it("2", async () => {
			const reviewPlan1 =
				await localStorageService.getReviewPlanByAnswerResultId(1);
			expect(reviewPlan1).toEqual({
				id: 1,
				answerResultId: 1,
				nextDate: dayjs("2024-12-10"),
				completed: false,
			});
			await expectLocalStorageToBe(ver2);
		});
		it("3", async () => {
			const reviewPlan2 =
				await localStorageService.getReviewPlanByAnswerResultId(2);
			expect(reviewPlan2).toBeNull();
			await expectLocalStorageToBe(ver2);
		});
	});

	describe("upsertReviewPlan", async () => {
		/**
		 * テスト項目:
		 * 1. 既存のreviewPlan(id=0,answerResultId=0)に対しupsertReviewPlanを実行すると、reviewPlansのみが適切に更新される
		 * 2. 既存のreviewPlan(id=1,answerResultId=1)に対しupsertReviewPlanを実行すると、reviewPlansのみが適切に更新される
		 * 3. 既存のanswerResult(id=3)に対しupsertReviewPlanを実行すると、reviewPlansとreviewPlansNextIdが適切に更新される
		 * 4. 存在しないanswerResult(id=5)に対しupsertReviewPlanを実行すると、Errorがスローされる
		 */
		const ver2 = {
			version: 2 as const,
			answerResults: [
				{
					i: 0,
					q: 0x114c01,
					s: 0x114c01,
					a: 20241207,
					r: AnswerResultEnum.Correct,
				},
				{
					i: 1,
					q: 0x114c02,
					s: 0x114c02,
					a: 20241208,
					r: AnswerResultEnum.Wrong,
				},
				{
					i: 2,
					q: 0x114c02,
					s: 0x114c02,
					a: 20241209,
					r: AnswerResultEnum.Correct,
				},
				{
					i: 3,
					q: 0x114c03,
					s: 0x114c03,
					a: 20241209,
					r: AnswerResultEnum.Wrong,
				},
				{
					i: 4,
					q: 0x114c03,
					s: 0x114c03,
					a: 20241210,
					r: AnswerResultEnum.Correct,
				},
			],
			answerResultsNextId: 5,
			reviewPlans: [
				{
					i: 0,
					a: 0,
					n: 20241209,
					c: 0,
				},
				{
					i: 1,
					a: 1,
					n: 20241210,
					c: 0,
				},
				{
					i: 2,
					a: 4,
					n: 20241211,
					c: 0,
				},
			],
			reviewPlansNextId: 3,
		};
		beforeEach(async () => {
			await setVer2(ver2);
		});
		it("1", async () => {
			await localStorageService.upsertReviewPlan(0, dayjs("2024-12-12"), true);
			await expectLocalStorageToBe({
				...ver2,
				reviewPlans: [
					{
						i: 0,
						a: 0,
						n: 20241212,
						c: 1,
					},
					...ver2.reviewPlans.slice(1, 3),
				],
			});
		});
		it("2", async () => {
			await localStorageService.upsertReviewPlan(1, dayjs("2024-12-13"), false);
			await expectLocalStorageToBe({
				...ver2,
				reviewPlans: [
					ver2.reviewPlans[0],
					{
						i: 1,
						a: 1,
						n: 20241213,
						c: 0,
					},
					ver2.reviewPlans[2],
				],
			});
		});
		it("3", async () => {
			await localStorageService.upsertReviewPlan(3, dayjs("2024-12-14"), true);
			await expectLocalStorageToBe({
				...ver2,
				reviewPlans: [
					...ver2.reviewPlans,
					{
						i: 3,
						a: 3,
						n: 20241214,
						c: 1,
					},
				],
				reviewPlansNextId: 4,
			});
		});
		it("4", async () => {
			await expect(async () => {
				await localStorageService.upsertReviewPlan(
					5,
					dayjs("2024-12-15"),
					false,
				);
			}).rejects.toThrow(Error);
			await expectLocalStorageToBe(ver2);
		});
	});

	describe("getUncompletedReviewPlans", async () => {
		/**
		 * テスト項目:
		 * 1. answerResultsとreviewPlansのランダムデータ100件(merged)を作成しlocal storageにセットする。getUncompletedReviewPlansを実行した結果がnextDate昇順であること、
		 * - 実行結果をquestionId昇順・answerDate昇順にソートしたもの
		 * - mergedを手動でフィルターしquestionId昇順・answerDate昇順にソートしたもの
		 * を比較した結果が同じであること、及びlocal storageは更新されないこと
		 */
		it("1", async () => {
			const merged = new Array<
				ReviewPlanType & {
					answerResult: AnswerResultType;
				}
			>(100);
			for (let i = 0; i < 100; i++) {
				const questionId = `1${faker.string.alphanumeric({
					length: { min: 4, max: 4 },
					casing: "upper",
				})}`;
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
			const ver2 = {
				version: 2 as const,
				answerResults: merged.map((merged) => ({
					i: merged.answerResult.id,
					q: Number.parseInt(merged.answerResult.questionId, 16),
					s: Number.parseInt(merged.answerResult.setId, 16),
					a: Number.parseInt(
						merged.answerResult.answerDate.format("YYYYMMDD"),
						10,
					),
					r: merged.answerResult.result,
				})),
				answerResultsNextId: 100,
				reviewPlans: merged.map((merged) => ({
					i: merged.id,
					a: merged.answerResultId,
					n: Number.parseInt(merged.nextDate.format("YYYYMMDD"), 10),
					c: merged.completed ? 1 : 0,
				})),
				reviewPlansNextId: 100,
			};
			await setVer2(ver2);

			const untilOrEqualTo = dayjs(faker.date.soon());
			const uncompletedReviewPlans =
				await localStorageService.getUncompletedReviewPlans(untilOrEqualTo);

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
			await expectLocalStorageToBe(ver2);
		});
	});
});
