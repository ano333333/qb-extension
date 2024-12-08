import type { AnswerResultEnum } from "../../logics/answerResultEnum";

export type LocalStorageVer1Schema = {
	version: 1;
	answerResults: Array<{
		id: number;
		questionId: string;
		setId: string;
		answerDate: string; // "YYYY-MM-DD"
		result: AnswerResultEnum;
	}>;
	answerResultsNextId: number;
	reviewPlans: Array<{
		id: number;
		answerResultId: number;
		nextDate: string; // "YYYY-MM-DD"
		completed: boolean;
	}>;
	reviewPlansNextId: number;
};

export const LocalStorageVer1Default: LocalStorageVer1Schema = {
	version: 1,
	answerResults: [],
	answerResultsNextId: 0,
	reviewPlans: [],
	reviewPlansNextId: 0,
};
