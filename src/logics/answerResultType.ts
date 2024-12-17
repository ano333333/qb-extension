import type { Dayjs } from "dayjs";
import type { AnswerResultEnum } from "./answerResultEnum";

export type AnswerResultType = {
	id: number;
	questionId: string;
	setId: string;
	answerDate: Dayjs;
	result: AnswerResultEnum;
};
