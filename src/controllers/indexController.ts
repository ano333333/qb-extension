import dayjs, { type Dayjs } from "dayjs";
import type { LocalStorageService } from "../services/localStorageService/localStorageService";
import { AnswerResultEnum } from "../logics/answerResultEnum";

export class IndexController {
	constructor(private readonly _localStorageService: LocalStorageService) {}

	public async validateLocalStorage() {
		return this._localStorageService.validateVersion();
	}

	public async getReviewPlans() {
		const today = dayjs();
		const rawReviewPlans =
			await this._localStorageService.getUncompletedReviewPlans(today);
		console.log(rawReviewPlans);
		// セットidごとにreview planをまとめる
		const setIdToReviewPlans: Record<string, typeof rawReviewPlans> = {};
		for (const plan of rawReviewPlans) {
			const setId = plan.answerResult.setId;
			if (!setIdToReviewPlans[setId]) {
				setIdToReviewPlans[setId] = [];
			}
			setIdToReviewPlans[setId].push(plan);
		}
		// セットidごとに最も低い回答結果・最も早い復習予定日を求める
		const tableDatas: {
			url: string;
			answerResult: AnswerResultEnum;
			reviewLimit: Dayjs;
		}[] = [];
		for (const [setId, reviewPlans] of Object.entries(setIdToReviewPlans)) {
			const lowestAnswerResult = reviewPlans.reduce((acc, plan) => {
				return acc.answerResult.result < plan.answerResult.result ? acc : plan;
			}, reviewPlans[0]);
			const earliestReviewLimit = reviewPlans.reduce((acc, plan) => {
				return acc.nextDate.isBefore(plan.nextDate) ? acc : plan;
			}, reviewPlans[0]);
			tableDatas.push({
				url: `https://qb.medilink-study.com/Answer/${setId}`,
				answerResult: lowestAnswerResult.answerResult.result,
				reviewLimit: earliestReviewLimit.nextDate,
			});
		}
		// 最終結果昇順、復習予定日昇順でソート
		const answerResultOrder: Record<AnswerResultEnum, number> = {
			[AnswerResultEnum.None]: 0,
			[AnswerResultEnum.Wrong]: 0,
			[AnswerResultEnum.Difficult]: 1,
			[AnswerResultEnum.Correct]: 2,
			[AnswerResultEnum.Easy]: 3,
		};
		tableDatas.sort((a, b) => {
			if (a.answerResult !== b.answerResult) {
				return (
					answerResultOrder[a.answerResult] - answerResultOrder[b.answerResult]
				);
			}
			return a.reviewLimit.diff(b.reviewLimit);
		});
		return tableDatas;
	}

	public async getDumpDataURL() {
		const dump = await this._localStorageService.dump();
		const blob = new Blob([dump], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		return url;
	}

	public async loadDumpData(file: File) {
		const dump = await file.text();
		await this._localStorageService.load(dump);
	}
}
