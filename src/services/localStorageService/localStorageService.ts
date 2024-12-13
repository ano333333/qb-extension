import { inject, injectable } from "inversify";
import type { ILocalStorageAdapter } from "../../adapters/localStorage/base";
import { TYPES } from "../../types";
import {
	LocalStorageVer1Default,
	type LocalStorageVer1Schema,
} from "./ver1Schema";
import type { AnswerResultEnum } from "../../logics/answerResultEnum";
import dayjs, { type Dayjs } from "dayjs";

@injectable()
export class LocalStorageService {
	private _localStorageAdapter: ILocalStorageAdapter;

	constructor(
		@inject(TYPES.ILocalStorageAdapter)
		localStorageAdapter: ILocalStorageAdapter,
	) {
		this._localStorageAdapter = localStorageAdapter;
	}

	/**
	 * local storageのバージョンをチェックし、デフォルト値のセットまたはバージョンアップを行う
	 */
	async validateVersion() {
		if (!(await this._localStorageAdapter.hasKey("version"))) {
			const defaultValues = { ...LocalStorageVer1Default };
			for (const key in defaultValues) {
				await this._localStorageAdapter.set(
					key,
					defaultValues[key as keyof typeof defaultValues],
				);
			}
		}
	}

	/**
	 * 問題IDに紐づく回答結果を取得
	 * @param questionId 問題ID
	 * @returns 回答結果の配列
	 */
	async getAnswerResultsByQuestionId(questionId: string) {
		const answerResults =
			await this._localStorageAdapter.get<
				LocalStorageVer1Schema["answerResults"]
			>("answerResults");
		return answerResults
			.filter((answerResult) => answerResult.questionId === questionId)
			.map((answerResult) => ({
				...answerResult,
				answerDate: dayjs(answerResult.answerDate),
			}));
	}

	/**
	 * 回答結果の登録または更新
	 * @param id 回答結果のID(nullの場合新規作成、numberの場合更新)
	 * @param questionId 問題ID
	 * @param setId セットID
	 * @param answerDate 回答日
	 * @param result 回答結果
	 * @returns 登録・更新したanswerResultのID
	 * @throws idが一致する回答結果が見つからない
	 */
	async upsertAnswerResult(
		id: number | null,
		questionId: string,
		setId: string,
		answerDate: Dayjs,
		result: AnswerResultEnum,
	) {
		console.log(
			`upsertAnswerResult: ${id} ${questionId} ${setId} ${answerDate.format("YYYY-MM-DD")} ${result}`,
		);
		const answerResults =
			await this._localStorageAdapter.get<
				LocalStorageVer1Schema["answerResults"]
			>("answerResults");
		const answerResultNextId = await this._localStorageAdapter.get<number>(
			"answerResultsNextId",
		);
		if (id !== null) {
			const answerResultIndex = answerResults.findIndex(
				(answerResult) => answerResult.id === id,
			);
			if (answerResultIndex === -1) {
				throw new Error("Answer result not found");
			}
			answerResults[answerResultIndex] = {
				id,
				questionId,
				setId,
				answerDate: answerDate.format("YYYY-MM-DD"),
				result,
			};
			await this._localStorageAdapter.set("answerResults", answerResults);
			return id;
		}
		answerResults.push({
			id: answerResultNextId,
			questionId,
			setId,
			answerDate: answerDate.format("YYYY-MM-DD"),
			result,
		});
		await this._localStorageAdapter.set("answerResults", answerResults);
		await this._localStorageAdapter.set(
			"answerResultsNextId",
			answerResultNextId + 1,
		);
		return answerResultNextId;
	}

	/**
	 * 回答結果IDに紐づく復習予定を取得
	 * @param answerResultId 回答結果ID
	 * @returns 復習予定
	 */
	async getReviewPlanByAnswerResultId(answerResultId: number) {
		const reviewPlans =
			await this._localStorageAdapter.get<
				LocalStorageVer1Schema["reviewPlans"]
			>("reviewPlans");
		const reviewPlan = reviewPlans.find(
			(reviewPlan) => reviewPlan.answerResultId === answerResultId,
		);
		if (reviewPlan === undefined) {
			return null;
		}
		return {
			...reviewPlan,
			nextDate: dayjs(reviewPlan.nextDate),
		};
	}

	/**
	 * レビュー予定の登録または更新
	 * @param answerResultId 回答結果ID(一致するレビュー予定がない場合新規作成)
	 * @param nextDate 次回レビュー日
	 * @param completed 復習完了フラグ
	 * @returns 登録・更新したreviewPlanのID
	 */
	async upsertReviewPlan(
		answerResultId: number,
		nextDate: Dayjs,
		completed: boolean,
	) {
		const reviewPlans =
			await this._localStorageAdapter.get<
				LocalStorageVer1Schema["reviewPlans"]
			>("reviewPlans");
		const reviewPlansNextId =
			await this._localStorageAdapter.get<number>("reviewPlansNextId");
		const reviewPlanIndex = reviewPlans.findIndex(
			(reviewPlan) => reviewPlan.answerResultId === answerResultId,
		);
		if (reviewPlanIndex === -1) {
			reviewPlans.push({
				id: reviewPlansNextId,
				answerResultId,
				nextDate: nextDate.format("YYYY-MM-DD"),
				completed,
			});
			await this._localStorageAdapter.set("reviewPlans", reviewPlans);
			await this._localStorageAdapter.set(
				"reviewPlansNextId",
				reviewPlansNextId + 1,
			);
			return reviewPlansNextId;
		}
		reviewPlans[reviewPlanIndex].nextDate = nextDate.format("YYYY-MM-DD");
		reviewPlans[reviewPlanIndex].completed = completed;
		await this._localStorageAdapter.set("reviewPlans", reviewPlans);
		return reviewPlans[reviewPlanIndex].id;
	}
	/**
	 * 未完了(completed === false)のreviewPlanで、nextDateがuntilOrEqualTo以下のものを、answerResultsと結合してnextDate昇順で取得
	 * @param untilOrEqualTo
	 * @returns
	 */
	async getUncompletedReviewPlans(untilOrEqualTo: Dayjs) {
		const reviewPlans =
			await this._localStorageAdapter.get<
				LocalStorageVer1Schema["reviewPlans"]
			>("reviewPlans");
		const answerResults =
			await this._localStorageAdapter.get<
				LocalStorageVer1Schema["answerResults"]
			>("answerResults");
		const idAnswerResultMap = new Map<number, (typeof answerResults)[number]>();
		for (const answerResult of answerResults) {
			idAnswerResultMap.set(answerResult.id, answerResult);
		}
		const filteredReviewPlans = reviewPlans
			.filter((reviewPlan) => !reviewPlan.completed)
			.filter(
				(reviewPlan) =>
					!dayjs(reviewPlan.nextDate).isAfter(untilOrEqualTo, "day"),
			)
			.sort((a, b) => dayjs(a.nextDate).diff(dayjs(b.nextDate)));
		return filteredReviewPlans.map((reviewPlan) => {
			const answerResult = idAnswerResultMap.get(reviewPlan.answerResultId);
			if (!answerResult) {
				throw new Error(
					`Answer result not found: ${reviewPlan.answerResultId}`,
				);
			}
			return {
				...reviewPlan,
				nextDate: dayjs(reviewPlan.nextDate),
				answerResult: {
					...answerResult,
					answerDate: dayjs(answerResult.answerDate),
				},
			};
		});
	}

	async dump() {
		const version = await this._localStorageAdapter.get<number>("version");
		const answerResults =
			await this._localStorageAdapter.get<
				LocalStorageVer1Schema["answerResults"]
			>("answerResults");
		const answerResultsNextId = await this._localStorageAdapter.get<number>(
			"answerResultsNextId",
		);
		const reviewPlans =
			await this._localStorageAdapter.get<
				LocalStorageVer1Schema["reviewPlans"]
			>("reviewPlans");
		const reviewPlansNextId =
			await this._localStorageAdapter.get<number>("reviewPlansNextId");
		const all = {
			version,
			answerResults,
			answerResultsNextId,
			reviewPlans,
			reviewPlansNextId,
		};
		return JSON.stringify(all, null, 0);
	}

	async load(dump: string) {
		const all = JSON.parse(dump);
		await this._localStorageAdapter.set("version", all.version);
		await this._localStorageAdapter.set("answerResults", all.answerResults);
		await this._localStorageAdapter.set(
			"answerResultsNextId",
			all.answerResultsNextId,
		);
		await this._localStorageAdapter.set("reviewPlans", all.reviewPlans);
		await this._localStorageAdapter.set(
			"reviewPlansNextId",
			all.reviewPlansNextId,
		);
	}
}
