export interface ILocalStorageAdapter {
	set<T>(key: string, value: T): Promise<void>;
	get<T>(key: string): Promise<T>;
	addListener<T>(key: string, callback: (value: T) => void): void;
}
