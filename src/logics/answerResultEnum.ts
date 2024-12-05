export const AnswerResultEnum = {
	None: 0,
	Wrong: 1,
	Difficult: 2,
	Correct: 3,
	Easy: 4,
} as const;

export type AnswerResultEnum =
	(typeof AnswerResultEnum)[keyof typeof AnswerResultEnum];
