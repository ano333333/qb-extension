import { inject, injectable } from "inversify";
import type { ILocalStorageAdapter } from "../../adapters/localStorage/base";
import { TYPES } from "../../types";
import type { AnswerResultEnum } from "../../logics/answerResultEnum";
import dayjs, { type Dayjs } from "dayjs";
import type { ILocalStorageService } from "./base";
import {
	convertVer1ToVer2,
	LocalStorageVer2Default,
	type LocalStorageVer2Schema,
} from "./ver2Schema";

@injectable()
export class LocalStorageService implements ILocalStorageService {
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
			const defaultValues = { ...LocalStorageVer2Default };
			for (const key in defaultValues) {
				await this._localStorageAdapter.set(
					key,
					defaultValues[key as keyof typeof defaultValues],
				);
			}
		}
		let version = await this._localStorageAdapter.get<number>("version");
		if (version === 1) {
			await convertVer1ToVer2(this._localStorageAdapter);
			version = await this._localStorageAdapter.get<number>("version");
		}
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
				LocalStorageVer2Schema["answerResults"]
			>("answerResults");
		const answerResultNextId = await this._localStorageAdapter.get<number>(
			"answerResultsNextId",
		);
		if (id !== null) {
			const answerResultIndex = answerResults.findIndex(
				(answerResult) => answerResult.i === id,
			);
			if (answerResultIndex === -1) {
				throw new Error("Answer result not found");
			}
			answerResults[answerResultIndex] = {
				i: id,
				q: Number.parseInt(questionId, 16),
				s: Number.parseInt(setId, 16),
				a: Number.parseInt(answerDate.format("YYYYMMDD")),
				r: result,
			};
			await this._localStorageAdapter.set("answerResults", answerResults);
			return id;
		}
		answerResults.push({
			i: answerResultNextId,
			q: Number.parseInt(questionId, 16),
			s: Number.parseInt(setId, 16),
			a: Number.parseInt(answerDate.format("YYYYMMDD")),
			r: result,
		});
		await this._localStorageAdapter.set("answerResults", answerResults);
		await this._localStorageAdapter.set(
			"answerResultsNextId",
			answerResultNextId + 1,
		);
		return answerResultNextId;
	}

	/**
	 * 問題IDに紐づく回答結果を取得
	 * @param questionId 問題ID
	 * @returns 回答結果の配列
	 */
	async getAnswerResultsByQuestionId(questionId: string) {
		const answerResults =
			await this._localStorageAdapter.get<
				LocalStorageVer2Schema["answerResults"]
			>("answerResults");
		const questionIdInt = Number.parseInt(questionId, 16);
		return answerResults
			.filter((answerResult) => answerResult.q === questionIdInt)
			.map(this._convertToAnswerResultEntity);
	}

	/**
	 * reviewPlanの登録または更新
	 * @param answerResultId 回答結果ID(idがanswerResultIdであるanswerResultに紐づくreviewPlanがない場合新規作成)
	 * @param nextDate 次回復習日
	 * @param completed 復習完了フラグ
	 * @returns 登録・更新したreviewPlanのID
	 * @throws idがanswerResultIdであるanswerResultが見つからない
	 */
	async upsertReviewPlan(
		answerResultId: number,
		nextDate: Dayjs,
		completed: boolean,
	) {
		const answerResults =
			await this._localStorageAdapter.get<
				LocalStorageVer2Schema["answerResults"]
			>("answerResults");
		const answerResult = answerResults.find(
			(answerResult) => answerResult.i === answerResultId,
		);
		if (answerResult === undefined) {
			throw new Error("Answer result not found");
		}
		const reviewPlans =
			await this._localStorageAdapter.get<
				LocalStorageVer2Schema["reviewPlans"]
			>("reviewPlans");
		const reviewPlansNextId =
			await this._localStorageAdapter.get<number>("reviewPlansNextId");
		const reviewPlanIndex = reviewPlans.findIndex(
			(reviewPlan) => reviewPlan.a === answerResultId,
		);
		if (reviewPlanIndex === -1) {
			reviewPlans.push({
				i: reviewPlansNextId,
				a: answerResultId,
				n: Number.parseInt(nextDate.format("YYYYMMDD")),
				c: completed ? 1 : 0,
			});
			await this._localStorageAdapter.set("reviewPlans", reviewPlans);
			await this._localStorageAdapter.set(
				"reviewPlansNextId",
				reviewPlansNextId + 1,
			);
			return reviewPlansNextId;
		}
		reviewPlans[reviewPlanIndex].n = Number.parseInt(
			nextDate.format("YYYYMMDD"),
		);
		reviewPlans[reviewPlanIndex].c = completed ? 1 : 0;
		await this._localStorageAdapter.set("reviewPlans", reviewPlans);
		return reviewPlans[reviewPlanIndex].i;
	}

	/**
	 * 回答結果IDに紐づく復習予定を取得
	 * @param answerResultId 回答結果ID
	 * @returns 復習予定
	 */
	async getReviewPlanByAnswerResultId(answerResultId: number) {
		const reviewPlans =
			await this._localStorageAdapter.get<
				LocalStorageVer2Schema["reviewPlans"]
			>("reviewPlans");
		const reviewPlan = reviewPlans.find(
			(reviewPlan) => reviewPlan.a === answerResultId,
		);
		if (reviewPlan === undefined) {
			return null;
		}
		return this._convertToReviewPlanEntity(reviewPlan);
	}

	/**
	 * 未完了(completed === false)のreviewPlanで、nextDateがuntilOrEqualTo以下のものを、answerResultsと結合してnextDate昇順で取得
	 * @param untilOrEqualTo
	 * @returns
	 */
	async getUncompletedReviewPlans(untilOrEqualTo: Dayjs) {
		const reviewPlans =
			await this._localStorageAdapter.get<
				LocalStorageVer2Schema["reviewPlans"]
			>("reviewPlans");
		const answerResults =
			await this._localStorageAdapter.get<
				LocalStorageVer2Schema["answerResults"]
			>("answerResults");
		const idAnswerResultMap = new Map<number, (typeof answerResults)[number]>();
		for (const answerResult of answerResults) {
			idAnswerResultMap.set(answerResult.i, answerResult);
		}
		const filteredReviewPlans = reviewPlans
			.filter((reviewPlan) => reviewPlan.c === 0)
			.filter(
				(reviewPlan) =>
					!dayjs(reviewPlan.n.toString()).isAfter(untilOrEqualTo, "day"),
			)
			.sort((a, b) => dayjs(a.n.toString()).diff(dayjs(b.n.toString())));
		return filteredReviewPlans.map((reviewPlan) => {
			const answerResult = idAnswerResultMap.get(reviewPlan.a);
			if (!answerResult) {
				throw new Error(`Answer result not found: ${reviewPlan.a}`);
			}
			return {
				...this._convertToReviewPlanEntity(reviewPlan),
				answerResult: this._convertToAnswerResultEntity(answerResult),
			};
		});
	}

	/**
	 * reviewPlanの削除
	 * @param id
	 */
	async deleteReviewPlan(id: number) {
		const reviewPlans =
			await this._localStorageAdapter.get<
				LocalStorageVer2Schema["reviewPlans"]
			>("reviewPlans");
		const reviewPlanIndex = reviewPlans.findIndex(
			(reviewPlan) => reviewPlan.i === id,
		);
		if (reviewPlanIndex !== -1) {
			reviewPlans.splice(reviewPlanIndex, 1);
			await this._localStorageAdapter.set("reviewPlans", reviewPlans);
		}
	}

	async dump() {
		const version = await this._localStorageAdapter.get<number>("version");
		const answerResults =
			await this._localStorageAdapter.get<
				LocalStorageVer2Schema["answerResults"]
			>("answerResults");
		const answerResultsNextId = await this._localStorageAdapter.get<number>(
			"answerResultsNextId",
		);
		const reviewPlans =
			await this._localStorageAdapter.get<
				LocalStorageVer2Schema["reviewPlans"]
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

	private _convertToAnswerResultEntity(
		answerResult: LocalStorageVer2Schema["answerResults"][number],
	) {
		return {
			id: answerResult.i,
			questionId: answerResult.q.toString(16).toUpperCase(),
			setId: answerResult.s.toString(16).toUpperCase(),
			answerDate: dayjs(answerResult.a.toString()),
			result: answerResult.r,
		};
	}

	private _convertToReviewPlanEntity(
		reviewPlan: LocalStorageVer2Schema["reviewPlans"][number],
	) {
		return {
			id: reviewPlan.i,
			answerResultId: reviewPlan.a,
			nextDate: dayjs(reviewPlan.n.toString()),
			completed: reviewPlan.c !== 0,
		};
	}
}
