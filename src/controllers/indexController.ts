import dayjs from "dayjs";
import type { LocalStorageService } from "../services/localStorageService/localStorageService";

export class IndexController {
	constructor(private readonly _localStorageService: LocalStorageService) {}

	public async validateLocalStorage() {
		return this._localStorageService.validateVersion();
	}

	public async getReviewPlans() {
		const today = dayjs();
		return (
			await this._localStorageService.getUncompletedReviewPlans(today)
		).map((plan) => {
			return {
				questionId: plan.answerResult.questionId,
				url: `https://qb.medilink-study.com/Answer/${plan.answerResult.setId}`,
				reviewLimit: plan.nextDate,
			};
		});
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
