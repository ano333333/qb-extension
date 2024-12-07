import { injectable } from "inversify";
import type { ILocalStorageAdapter } from "./base";

@injectable()
export class ChromeLocalStorageAdapter implements ILocalStorageAdapter {
	set<T>(key: string, value: T): Promise<void> {
		return chrome.storage.local.set({ [key]: value });
	}
	async get<T>(key: string): Promise<T> {
		const res = await chrome.storage.local.get(key);
		if (res[key] === undefined) {
			throw new Error(`${key} not found`);
		}
		return res[key] as T;
	}
	addListener<T>(key: string, callback: (value: T) => void): void {
		chrome.storage.local.onChanged.addListener((changes) => {
			if (changes[key]) {
				callback(changes[key].newValue as T);
			}
		});
	}
}
