import type { ZodSchema } from "zod";
import type { ILocalStorageAdapter } from "../../../src/adapters/localStorage/base";
import { injectable } from "inversify";

@injectable()
export class MockLocalStorage implements ILocalStorageAdapter {
	_data: Record<string, unknown>;
	_listeners: Record<string, ((data: unknown) => void)[]> = {};

	constructor(data: Record<string, unknown> = {}) {
		this._data = JSON.parse(JSON.stringify(data));
	}

	async set(key: string, value: unknown) {
		this._data[key] = JSON.parse(JSON.stringify(value));
		for (const listener of this._listeners[key] ?? []) {
			listener(JSON.parse(JSON.stringify(value)));
		}
	}

	async hasKey(key: string): Promise<boolean> {
		return this._data[key] !== undefined;
	}

	async get<T>(key: string): Promise<T> {
		if (this._data[key] === undefined) {
			throw new Error(`local storage key ${key} not found`);
		}
		return JSON.parse(JSON.stringify(this._data[key])) as T;
	}

	async addListener<T>(key: string, listener: (data: T) => void) {
		this._listeners[key] ??= [];
		this._listeners[key].push(listener as (data: unknown) => void);
	}

	validateData<T>(key: string, zSchema: ZodSchema<T>) {
		const value = this._data[key];
		zSchema.parse(value);
	}
}
