import type { ILocalStorageAdapter } from "../../adapters/localStorage/base";
import type { AnswerResultEnum } from "../../logics/answerResultEnum";
import type { LocalStorageVer1Schema } from "./ver1Schema";

export type LocalStorageVer2Schema = {
	version: 2;
	answerResults: Array<{
		i: number; // id
		q: number; // questionId("114C05"などの形式のstringをparseInt(questionId, 16)で変換)
		s: number; // setId("114C05"などの形式のstringをparseInt(setId, 16)で変換)
		a: number; // answerDate("YYYY-MM-DD"のstringをparseInt(answerDate.split("-").join(""), 10)で変換)
		r: AnswerResultEnum;
	}>;
	answerResultsNextId: number;
	reviewPlans: Array<{
		i: number; // id
		a: number; // answerResultId
		n: number; // nextDate("YYYY-MM-DD"のstringをparseInt(nextDate.split("-").join(""), 10)で変換)
		c: number; // completed(true/falseをcompleted ? 1 : 0で変換)
	}>;
	reviewPlansNextId: number;
};

export const LocalStorageVer2Default: LocalStorageVer2Schema = {
	version: 2,
	answerResults: [],
	answerResultsNextId: 0,
	reviewPlans: [],
	reviewPlansNextId: 0,
};

export async function convertVer1ToVer2(adapter: ILocalStorageAdapter) {
	await adapter.set("version", 2);
	const answerResults =
		await adapter.get<LocalStorageVer1Schema["answerResults"]>("answerResults");
	const newAnswerResults = answerResults.map((result) => ({
		i: result.id,
		q: Number.parseInt(result.questionId, 16),
		s: Number.parseInt(result.setId, 16),
		a: Number.parseInt(result.answerDate.split("-").join(""), 10),
		r: result.result,
	}));
	await adapter.set("answerResults", newAnswerResults);
	const reviewPlans =
		await adapter.get<LocalStorageVer1Schema["reviewPlans"]>("reviewPlans");
	const newReviewPlans = reviewPlans.map((plan) => ({
		i: plan.id,
		a: plan.answerResultId,
		n: Number.parseInt(plan.nextDate.split("-").join(""), 10),
		c: plan.completed ? 1 : 0,
	}));
	await adapter.set("reviewPlans", newReviewPlans);
}
