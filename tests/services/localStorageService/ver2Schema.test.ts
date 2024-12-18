import { describe, expect, it } from "vitest";
import { MockLocalStorage } from "../../adapters/localStorage/mockLocalStorage";
import { AnswerResultEnum } from "../../../src/logics/answerResultEnum";
import { convertVer1ToVer2 } from "../../../src/services/localStorageService/ver2Schema";

describe("LocalStorageVer2Schema", () => {
	it("convertVer1ToVer2", async () => {
		/**
		 * テスト項目:
		 * - 1. MockLocalStorageでLocalStorageVer1Schemaに該当するデータを設定しconvertVer1ToVer2を行うと、内容の合ったLocalStorageVer2Schemaになっている
		 */
		const localStorageAdapter = new MockLocalStorage();
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
		await localStorageAdapter.set("version", 1);
		await localStorageAdapter.set("answerResults", ver1.answerResults);
		await localStorageAdapter.set(
			"answerResultsNextId",
			ver1.answerResultsNextId,
		);
		await localStorageAdapter.set("reviewPlans", ver1.reviewPlans);
		await localStorageAdapter.set("reviewPlansNextId", ver1.reviewPlansNextId);
		await convertVer1ToVer2(localStorageAdapter);
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
		expect(await localStorageAdapter.get("version")).toEqual(2);
		expect(await localStorageAdapter.get("answerResults")).toEqual(
			ver2.answerResults,
		);
		expect(await localStorageAdapter.get("answerResultsNextId")).toEqual(
			ver2.answerResultsNextId,
		);
		expect(await localStorageAdapter.get("reviewPlans")).toEqual(
			ver2.reviewPlans,
		);
		expect(await localStorageAdapter.get("reviewPlansNextId")).toEqual(
			ver2.reviewPlansNextId,
		);
	});
});
