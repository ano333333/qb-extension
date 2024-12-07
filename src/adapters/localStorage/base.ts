export interface ILocalStorageAdapter {
	hasKey(key: string): Promise<boolean>;
	get<T>(key: string): Promise<T>;
	set<T>(key: string, value: T): Promise<void>;
	addListener<T>(key: string, callback: (value: T) => void): void;
}
