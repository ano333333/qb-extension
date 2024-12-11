import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../tailwind.css";
import { container } from "../../inversify.config";
import type { LocalStorageService } from "../../services/localStorageService/localStorageService";
import { TYPES } from "../../types";
import Notifier from "./notifier";
import { AnswerResultEnum } from "../../logics/answerResultEnum";
import dayjs from "dayjs";
import { upsertAnswerResultAndReviewPlan } from "../../usecases/upsertAnswerResultAndReviewPlan";

const localStorageService = container.get<LocalStorageService>(
	TYPES.LocalStorageService,
);
const app = document.getElementById("app");

let setId = "";
// questionYear(questionIdが"113A56"ならば113など)を取得
let questionYear = 0;

let currentUrl = "";
// 一定時間おきにポーリングして、URL変化をlistenする
setInterval(() => {
	console.log("setInterval");
	if (currentUrl !== window.location.href) {
		currentUrl = window.location.href;
		if (
			currentUrl.match(/https:\/\/qb.medilink-study.com\/Answer\/[0-9A-D]+/) !==
			null
		) {
			onPageLoaded();
		}
	}
}, 500);

function onPageLoaded() {
	console.log("content.tsx");

	// local storageのバリデーション中表示
	const thirdChild = app?.children[2];
	if (thirdChild) {
		const container = document.createElement("div");
		createRoot(container).render(
			<StrictMode>
				<Notifier
					promise={localStorageService.validateVersion()}
					message="qb-extension: ローカルストレージのバリデーション中です。ウィンドウを閉じないでください。"
				/>
			</StrictMode>,
		);
		app?.insertBefore(container, thirdChild);
	}

	setId = getSetId();
	questionYear = 0;

	const intervalId = setInterval(async () => {
		try {
			questionYear = await getQuestionYear();
			setOnClickCheckAnswerBtn();
			clearInterval(intervalId);
		} catch {
			return;
		}
		console.log(questionYear);
	}, 500);
}

/**
 * URL('https://qb.medilink-study.com/Answer/${setId}')からsetIdを取得
 * @returns
 */
function getSetId() {
	const url = window.location.href;
	const setId = url.match(/Answer\/([0-9A-Z]+)/)?.at(1);
	if (!setId) {
		throw new Error(`no match setId: ${url}`);
	}
	return setId;
}

/**
 * DOMからquestionYear(questionIdが"113A56"ならば113など)を取得
 * @returns
 */
async function getQuestionYear() {
	const headerDivSpanXpath = "//div[@class='header']//span[1]";
	const headerDivSpan = document.evaluate(
		headerDivSpanXpath,
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
		null,
	);
	if (!headerDivSpan.singleNodeValue) {
		throw new Error(`no match element: ${headerDivSpanXpath}`);
	}
	const mergedSetIdAndQuestionIds =
		headerDivSpan.singleNodeValue.textContent?.trim();
	if (!mergedSetIdAndQuestionIds) {
		throw new Error("mergedSetIdAndQuestionIds is empty");
	}

	// mergedSetIdAndQuestionIdsは"113A56"、"115F68-70"のような形式なので、year(113, 115)を取りだす
	const year = mergedSetIdAndQuestionIds.match(/^\d+/)?.at(0);
	if (!year) {
		throw new Error(`Invalid questionId format: ${mergedSetIdAndQuestionIds}`);
	}
	return Number.parseInt(year);
}

/**
 * 「解答を確認する」ボタンに対するonclickを登録する
 */
function setOnClickCheckAnswerBtn() {
	const checkAnswerBtnXpath = "//*[@id='answerSection']/div";
	const checkAnswerBtn = document.evaluate(
		checkAnswerBtnXpath,
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
		null,
	).singleNodeValue;
	if (!(checkAnswerBtn instanceof Element)) {
		throw new Error(`no match element: ${checkAnswerBtnXpath}`);
	}
	checkAnswerBtn.addEventListener("click", onClickCheckAnswerBtn);
}

/**
 * 「解答を確認する」ボタンをクリックしたときの処理
 */
async function onClickCheckAnswerBtn() {
	const today = dayjs();
	const resultContentDivsXpath = "//div[@class='resultContent']";
	const resultContentDivs = document.evaluate(
		resultContentDivsXpath,
		document,
		null,
		XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
		null,
	);
	for (let index = 0; index < resultContentDivs.snapshotLength; index++) {
		const resultContentDiv = resultContentDivs.snapshotItem(index);
		if (!(resultContentDiv instanceof HTMLDivElement)) {
			throw new Error(`no match element: ${resultContentDiv}`);
		}

		/**
		 * 1. questionIdを取得
		 */
		const numberDivXpath = ".//div[@class='resultContent--number']";
		const numberDiv = document.evaluate(
			numberDivXpath,
			resultContentDiv,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null,
		).singleNodeValue;
		if (!(numberDiv instanceof HTMLDivElement) || !numberDiv.textContent) {
			throw new Error(`no match element: ${numberDivXpath}`);
		}
		const numberDivText = numberDiv.textContent.trim();
		let questionId = "";
		// 単問の場合は、各小問ごとのdivには「113A56」のようにquestionYearから表示される
		// 複問の場合は、各小問ごとのdivには「A56」のようにquestionYearを省いて表示される
		if (numberDivText.match(/^\d+/)) {
			questionId = numberDivText;
		} else {
			questionId = `${questionYear}${numberDivText}`;
		}

		/**
		 * 2. 選択したAnswerResultEnumを取得
		 */
		const currentAnswerIconSpanXpath =
			".//div[@class='resultContent--currentAnswer']//span[contains(@class, 'custom-icon-icon_')]";
		const currentAnswerIconSpan = document.evaluate(
			currentAnswerIconSpanXpath,
			resultContentDiv,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null,
		).singleNodeValue;
		if (!(currentAnswerIconSpan instanceof HTMLSpanElement)) {
			throw new Error(`no match element: ${currentAnswerIconSpanXpath}`);
		}
		const classNameMatch = currentAnswerIconSpan.className.match(
			/custom-icon-icon_(perfect|good|ok|fail|notry)/,
		);
		if (!classNameMatch) {
			throw new Error(
				`className does not match the expected pattern: ${currentAnswerIconSpan.className}`,
			);
		}
		const matchedClassName = classNameMatch[0];
		const answerResultEnum = convertToAnswerResultEnum(matchedClassName);
		await upsertAnswerResultAndReviewPlan(
			localStorageService,
			questionId,
			setId,
			today,
			answerResultEnum,
		);

		/**
		 * 3. AnswerResultEnum更新ボタンに対するonclickを登録
		 */
		const updateAnswerResultLisXpath =
			".//div[@class='resultContent--current']//li";
		const updateAnswerResultLis = document.evaluate(
			updateAnswerResultLisXpath,
			resultContentDiv,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null,
		);
		for (
			let liIndex = 0;
			liIndex < updateAnswerResultLis.snapshotLength;
			liIndex++
		) {
			const updateAnswerResultLi = updateAnswerResultLis.snapshotItem(liIndex);
			if (!(updateAnswerResultLi instanceof HTMLLIElement)) {
				throw new Error(`no match element: ${updateAnswerResultLi}`);
			}
			const answerResultEnum = [
				AnswerResultEnum.Easy,
				AnswerResultEnum.Correct,
				AnswerResultEnum.Difficult,
				AnswerResultEnum.Wrong,
				AnswerResultEnum.None,
			][liIndex];
			updateAnswerResultLi.addEventListener("click", () => {
				onClickUpdateAnswerResultBtn(questionId, answerResultEnum);
			});
		}
	}
}

/**
 * AnswerResultEnum更新ボタンをクリックしたときの処理
 * @param questionId
 * @param answerResultEnum
 */
function onClickUpdateAnswerResultBtn(
	questionId: string,
	answerResultEnum: AnswerResultEnum,
) {
	console.log(questionId, answerResultEnum);
	const today = dayjs();
	upsertAnswerResultAndReviewPlan(
		localStorageService,
		questionId,
		setId,
		today,
		answerResultEnum,
	);
}

/**
 * 「◎」〜「ー」が表示されているspanのclassNameからAnswerResultEnumを取得
 * @param className custom-icon-icon_perfect 〜 custom-icon-icon_notry
 * @returns
 */
function convertToAnswerResultEnum(className: string) {
	const map = {
		"custom-icon-icon_perfect": AnswerResultEnum.Easy,
		"custom-icon-icon_good": AnswerResultEnum.Correct,
		"custom-icon-icon_ok": AnswerResultEnum.Difficult,
		"custom-icon-icon_fail": AnswerResultEnum.Wrong,
		"custom-icon-icon_notry": AnswerResultEnum.None,
	};
	if (!(className in map)) {
		throw new Error(
			`Invalid className for convertToAnswerResultEnum: ${className}`,
		);
	}
	return map[className as keyof typeof map];
}
