import { Container } from "inversify";
import { TYPES } from "./types";
import type { ILocalStorageAdapter } from "./adapters/localStorage/base";
import { ChromeLocalStorageAdapter } from "./adapters/localStorage/chromeLocalStorageAdapter";
import { LocalStorageService } from "./services/localStorageService/localStorageService";

const container = new Container();
container
	.bind<ILocalStorageAdapter>(TYPES.ILocalStorageAdapter)
	.to(ChromeLocalStorageAdapter);
container
	.bind<LocalStorageService>(TYPES.LocalStorageService)
	.to(LocalStorageService);

export { container };
