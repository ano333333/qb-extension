import type { Dayjs } from "dayjs";
import type { AnswerResultEnum } from "../../logics/answerResultEnum";
import type { AnswerResultType } from "../../logics/answerResultType";
import type { ReviewPlanType } from "../../logics/reviewPlanType";

export interface ILocalStorageService {
	/**
	 * local storageのバージョンをチェックし、デフォルト値のセットまたはバージョンアップを行う
	 */
	validateVersion(): Promise<void>;

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
	upsertAnswerResult(
		id: number | null,
		questionId: string,
		setId: string,
		answerDate: Dayjs,
		result: AnswerResultEnum,
	): Promise<number>;

	/**
	 * 問題IDに紐づく回答結果を取得
	 * @param questionId 問題ID
	 * @returns 回答結果の配列
	 */
	getAnswerResultsByQuestionId(
		questionId: string,
	): Promise<Array<AnswerResultType>>;

	/**
	 * reviewPlanの登録または更新
	 * @param answerResultId 回答結果ID(idがanswerResultIdであるanswerResultに紐づくreviewPlanがない場合新規作成)
	 * @param nextDate 次回復習日
	 * @param completed 復習完了フラグ
	 * @returns 登録・更新したreviewPlanのID
	 * @throws idがanswerResultIdであるanswerResultが見つからない
	 */
	upsertReviewPlan(
		answerResultId: number,
		nextDate: Dayjs,
		completed: boolean,
	): Promise<number>;

	/**
	 * 回答結果IDに紐づく復習予定を取得
	 * @param answerResultId 回答結果ID
	 * @returns 復習予定
	 */
	getReviewPlanByAnswerResultId(
		answerResultId: number,
	): Promise<ReviewPlanType | null>;

	/**
	 * 未完了(completed === false)のreviewPlanで、nextDateがuntilOrEqualTo以下のものを、answerResultsと結合してnextDate昇順で取得
	 * @param untilOrEqualTo
	 * @returns
	 */
	getUncompletedReviewPlans(
		untilOrEqualTo: Dayjs,
	): Promise<Array<ReviewPlanType & { answerResult: AnswerResultType }>>;

	/**
	 * reviewPlanの削除
	 * @param id
	 */
	deleteReviewPlan(id: number): Promise<void>;

	/**
	 * local storageの内容をダンプ
	 * @returns ダンプされた内容のJSON文字列
	 */
	dump(): Promise<string>;

	/**
	 * ダンプされた内容をlocal storageにロード
	 * @param dump ダンプされた内容のJSON文字列
	 */
	load(dump: string): Promise<void>;
}
