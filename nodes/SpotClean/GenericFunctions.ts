import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

type SpotCleanContext = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions | IWebhookFunctions;

function normalizeBaseUrl(raw: string): string {
	const trimmed = (raw || 'https://api.spotclean.app').trim().replace(/\/$/, '');
	return trimmed.replace(/\/api$/i, '') || 'https://api.spotclean.app';
}

/** Drop empty optional fields so the API ignores them cleanly. */
export function omitEmpty(obj: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const [key, value] of Object.entries(obj)) {
		if (value === undefined || value === null || value === '') continue;
		out[key] = value;
	}
	return out;
}

export async function spotCleanApiRequest(
	this: SpotCleanContext,
	method: IHttpRequestMethods,
	path: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<unknown> {
	const credentials = await this.getCredentials('spotCleanApi');
	const baseUrl = normalizeBaseUrl(String(credentials.baseUrl ?? 'https://api.spotclean.app'));
	const p = path.startsWith('/') ? path : `/${path}`;

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}/api/integrations/v1${p}`,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		qs: omitEmpty(qs),
		json: true,
	};

	if (method !== 'GET' && method !== 'HEAD' && method !== 'DELETE') {
		options.body = body;
	} else if (Object.keys(body).length > 0) {
		options.body = body;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'spotCleanApi', options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export function asItems(data: unknown): IDataObject[] {
	if (Array.isArray(data)) return data as IDataObject[];
	if (data && typeof data === 'object' && Array.isArray((data as IDataObject).items)) {
		return (data as IDataObject).items as IDataObject[];
	}
	if (data && typeof data === 'object') return [data as IDataObject];
	return [];
}

export function labelForRecord(row: IDataObject, fallbackId: string): string {
	const nickname = row.nickname ?? row.name ?? row.ownerName ?? row.description;
	if (typeof nickname === 'string' && nickname.trim()) {
		return `${nickname.trim()} (${fallbackId})`;
	}
	return fallbackId;
}
