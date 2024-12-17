import type { Dayjs } from "dayjs";

export type ReviewPlanType = {
	id: number;
	answerResultId: number;
	nextDate: Dayjs;
	completed: boolean;
};
