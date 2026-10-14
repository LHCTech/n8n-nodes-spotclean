import {
	NodeConnectionTypes,
	type IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';

import { asItems, spotCleanApiRequest } from '../SpotClean/GenericFunctions';

const EVENTS = [
	{ name: 'Client Created', value: 'client.created' },
	{ name: 'Client Updated', value: 'client.updated' },
	{ name: 'House Created', value: 'house.created' },
	{ name: 'Visit Created', value: 'visit.created' },
	{ name: 'Visit Changed', value: 'visit.changed' },
	{ name: 'Visit Canceled', value: 'visit.canceled' },
	{ name: 'Visit Finished', value: 'visit.finished' },
	{ name: 'Invoice Created', value: 'invoice.created' },
	{ name: 'Invoice Paid', value: 'invoice.paid' },
];

export class SpotCleanTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SpotClean Trigger',
		name: 'spotCleanTrigger',
		icon: {
			light: 'file:../SpotClean/spotclean.svg',
			dark: 'file:../SpotClean/spotclean.dark.svg',
		},
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when SpotClean emits a selected event',
		defaults: {
			name: 'SpotClean Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'spotCleanApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: EVENTS,
				default: 'visit.finished',
				required: true,
				description: 'SpotClean webhook event to subscribe to',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');
				const event = this.getNodeParameter('event') as string;
				const hooks = asItems(await spotCleanApiRequest.call(this, 'GET', '/hooks'));
				for (const hook of hooks) {
					if (hook.targetUrl === webhookUrl && hook.event === event) {
						webhookData.webhookId = hook.id as string;
						return true;
					}
				}
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');
				const event = this.getNodeParameter('event') as string;
				const response = (await spotCleanApiRequest.call(this, 'POST', '/hooks', {
					event,
					targetUrl: webhookUrl,
				})) as IDataObject;
				if (!response?.id) return false;
				webhookData.webhookId = response.id as string;
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId === undefined) return true;
				try {
					await spotCleanApiRequest.call(
						this,
						'DELETE',
						`/hooks/${encodeURIComponent(String(webhookData.webhookId))}`,
					);
				} catch (error) {
					this.logger.error('Failed to delete SpotClean webhook subscription', {
						error: error instanceof Error ? error.message : String(error),
						webhookId: webhookData.webhookId,
					});
					return false;
				}
				delete webhookData.webhookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
