import { injectable } from "inversify";
import type { ILocalStorageAdapter } from "./base";

@injectable()
export class ChromeLocalStorageAdapter implements ILocalStorageAdapter {
	async hasKey(key: string): Promise<boolean> {
		const res = await chrome.storage.local.get(key);
		return res[key] !== undefined;
	}
	async get<T>(key: string): Promise<T> {
		const res = await chrome.storage.local.get(key);
		if (res[key] === undefined) {
			throw new Error(`local storage key ${key} not found`);
		}
		return res[key] as T;
	}
	async set<T>(key: string, value: T): Promise<void> {
		return chrome.storage.local.set({ [key]: value });
	}
	addListener<T>(key: string, callback: (value: T) => void): void {
		chrome.storage.local.onChanged.addListener((changes) => {
			if (changes[key]) {
				callback(changes[key].newValue as T);
			}
		});
	}
}
