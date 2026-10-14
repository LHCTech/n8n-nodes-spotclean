import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class SpotCleanApi implements ICredentialType {
	name = 'spotCleanApi';

	displayName = 'SpotClean API';

	documentationUrl = 'https://api.spotclean.app/api/docs/integrations';

	icon: Icon = {
		light: 'file:../nodes/SpotClean/spotclean.svg',
		dark: 'file:../nodes/SpotClean/spotclean.dark.svg',
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'From SpotClean → Settings → Integrations → n8n. Token looks like `sc_live_…` (shown once when created).',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.spotclean.app',
			description:
				'API origin without trailing slash. Override for staging (e.g. https://staging-api.spotclean.app).',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/integrations/v1/me',
			method: 'GET',
		},
	};
}
