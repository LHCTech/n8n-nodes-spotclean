import {
	NodeConnectionTypes,
	NodeApiError,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

import { asItems, labelForRecord, omitEmpty, spotCleanApiRequest } from './GenericFunctions';

export class SpotClean implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SpotClean',
		name: 'spotClean',
		icon: {
			light: 'file:spotclean.svg',
			dark: 'file:spotclean.dark.svg',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage SpotClean clients, houses, visits, and invoices',
		defaults: {
			name: 'SpotClean',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'spotCleanApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Client', value: 'client' },
					{ name: 'House', value: 'house' },
					{ name: 'Visit', value: 'visit' },
					{ name: 'Invoice', value: 'invoice' },
				],
				default: 'client',
			},
			// Client operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['client'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a client' },
					{ name: 'Delete', value: 'delete', action: 'Delete a client' },
					{ name: 'Get', value: 'get', action: 'Get a client' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many clients' },
					{ name: 'Update', value: 'update', action: 'Update a client' },
				],
				default: 'getAll',
			},
			// House operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['house'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a house' },
					{ name: 'Delete', value: 'delete', action: 'Delete a house' },
					{ name: 'Get', value: 'get', action: 'Get a house' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many houses' },
					{ name: 'Update', value: 'update', action: 'Update a house' },
				],
				default: 'getAll',
			},
			// Visit operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['visit'] } },
				options: [
					{ name: 'Cancel', value: 'cancel', action: 'Cancel a visit' },
					{ name: 'Create', value: 'create', action: 'Create a visit' },
					{ name: 'Get', value: 'get', action: 'Get a visit' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many visits' },
					{ name: 'Update', value: 'update', action: 'Update a visit' },
				],
				default: 'getAll',
			},
			// Invoice operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['invoice'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create an invoice' },
					{ name: 'Delete', value: 'delete', action: 'Delete an invoice' },
					{ name: 'Get', value: 'get', action: 'Get an invoice' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many invoices' },
					{ name: 'Mark Paid', value: 'markPaid', action: 'Mark an invoice as paid' },
				],
				default: 'getAll',
			},

			// --- Shared ID / cascade pickers ---
			{
				displayName: 'Client Name or ID',
				name: 'clientId',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: { loadOptionsMethod: 'getClients' },
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['client'],
						operation: ['get', 'update', 'delete'],
					},
				},
			},
			{
				displayName: 'Client Name or ID',
				name: 'clientId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getClients' },
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['house'],
						operation: ['getAll', 'create', 'get', 'update', 'delete'],
					},
				},
				description: 'Required to list houses. Used to cascade house pickers. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Client Name or ID',
				name: 'clientId',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: { loadOptionsMethod: 'getClients' },
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['visit'],
						operation: ['getAll', 'create', 'get', 'update', 'cancel'],
					},
				},
			},
			{
				displayName: 'Client Name or ID',
				name: 'clientId',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: { loadOptionsMethod: 'getClients' },
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['create', 'get', 'delete', 'markPaid'],
					},
				},
			},
			{
				displayName: 'Client Name or ID',
				name: 'clientId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getClients' },
				default: '',
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['getAll'],
					},
				},
				description: 'Optional filter when listing invoices. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'House Name or ID',
				name: 'houseId',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getHouses',
					loadOptionsDependsOn: ['clientId'],
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['house'],
						operation: ['get', 'update', 'delete'],
					},
				},
			},
			{
				displayName: 'House Name or ID',
				name: 'houseId',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getHouses',
					loadOptionsDependsOn: ['clientId'],
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['visit'],
						operation: ['getAll', 'create', 'get', 'update', 'cancel'],
					},
				},
			},
			{
				displayName: 'House Name or ID',
				name: 'houseId',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getHouses',
					loadOptionsDependsOn: ['clientId'],
				},
				default: '',
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Visit Name or ID',
				name: 'visitId',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getVisits',
					loadOptionsDependsOn: ['houseId'],
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['visit'],
						operation: ['get', 'update', 'cancel'],
					},
				},
			},
			{
				displayName: 'Invoice Name or ID',
				name: 'invoiceId',
				type: 'options',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getInvoices',
					loadOptionsDependsOn: ['clientId'],
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['invoice'],
						operation: ['get', 'delete', 'markPaid'],
					},
				},
			},

			// Pagination / search
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				description: 'Whether to return all results or only up to a given limit',
				default: false,
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				description: 'Max number of results to return',
				typeOptions: { minValue: 1, maxValue: 100 },
				default: 50,
				displayOptions: {
					show: {
						operation: ['getAll'],
						returnAll: [false],
					},
				},
			},
			{
				displayName: 'Search',
				name: 'q',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['client', 'house'],
						operation: ['getAll'],
					},
				},
			},

			// Client create / update
			{
				displayName: 'Nickname',
				name: 'nickname',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['client'], operation: ['create'] } },
			},
			{
				displayName: 'Owner Phone',
				name: 'ownerPhone',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['client'], operation: ['create'] } },
			},
			{
				displayName: 'House Address',
				name: 'houseAddress',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['client'], operation: ['create'] } },
				description: 'Clients must be created with at least one property (min 3 characters)',
			},
			{
				displayName: 'Owner Name',
				name: 'ownerName',
				type: 'string',
				default: '',
				displayOptions: {
					show: { resource: ['client'], operation: ['create', 'update'] },
				},
			},
			{
				displayName: 'Owner Email',
				name: 'ownerEmail',
				type: 'string',
				default: '',
				displayOptions: {
					show: { resource: ['client'], operation: ['create', 'update'] },
				},
			},
			{
				displayName: 'House Name',
				name: 'houseName',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['client'], operation: ['create'] } },
			},
			{
				displayName: 'Address Complement',
				name: 'addressComplement',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['client', 'house'],
						operation: ['create', 'update'],
					},
				},
			},
			{
				displayName: 'Nickname',
				name: 'nickname',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['client'], operation: ['update'] } },
			},
			{
				displayName: 'Owner Phone',
				name: 'ownerPhone',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['client'], operation: ['update'] } },
			},
			{
				displayName: 'Clear Owner Email',
				name: 'clearOwnerEmail',
				type: 'boolean',
				default: false,
				displayOptions: { show: { resource: ['client'], operation: ['update'] } },
			},

			// House create / update
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['house'], operation: ['create'] } },
			},
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { resource: ['house'], operation: ['create'] } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['house'], operation: ['update'] } },
			},
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['house'], operation: ['update'] } },
			},
			{
				displayName: 'Latitude',
				name: 'latitude',
				type: 'number',
				default: 0,
				displayOptions: {
					show: { resource: ['house'], operation: ['create', 'update'] },
				},
			},
			{
				displayName: 'Longitude',
				name: 'longitude',
				type: 'number',
				default: 0,
				displayOptions: {
					show: { resource: ['house'], operation: ['create', 'update'] },
				},
			},

			// Visit create / update / cancel
			{
				displayName: 'Visit Type',
				name: 'kind',
				type: 'options',
				options: [
					{ name: 'One-Time Visit', value: 'ONE_OFF' },
					{ name: 'Recurring Series', value: 'RECURRING' },
				],
				default: 'ONE_OFF',
				required: true,
				displayOptions: { show: { resource: ['visit'], operation: ['create'] } },
			},
			{
				displayName: 'Frequency',
				name: 'frequency',
				type: 'options',
				options: [
					{ name: 'Weekly', value: 'WEEKLY' },
					{ name: 'Biweekly', value: 'BIWEEKLY' },
					{ name: 'Every 4 Weeks', value: 'EVERY_4_WEEKS' },
					{ name: 'Monthly', value: 'MONTHLY' },
				],
				default: 'WEEKLY',
				displayOptions: {
					show: {
						resource: ['visit'],
						operation: ['create'],
						kind: ['RECURRING'],
					},
				},
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'YYYY-MM-DD',
				displayOptions: {
					show: {
						resource: ['visit'],
						operation: ['create', 'cancel'],
					},
				},
			},
			{
				displayName: 'Estimated Time',
				name: 'estimatedTime',
				type: 'string',
				default: '',
				placeholder: 'HH:mm',
				displayOptions: { show: { resource: ['visit'], operation: ['create'] } },
			},
			{
				displayName: 'Flat Amount',
				name: 'flatAmount',
				type: 'number',
				default: 0,
				displayOptions: { show: { resource: ['visit'], operation: ['create'] } },
			},
			{
				displayName: 'Flat Description',
				name: 'flatDescription',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['visit'], operation: ['create'] } },
			},
			{
				displayName: 'Flat Duration (Minutes)',
				name: 'flatDurationMinutes',
				type: 'number',
				default: 0,
				displayOptions: { show: { resource: ['visit'], operation: ['create'] } },
			},
			{
				displayName: 'From Date',
				name: 'fromDate',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'YYYY-MM-DD',
				displayOptions: { show: { resource: ['visit'], operation: ['update'] } },
			},
			{
				displayName: 'To Date',
				name: 'toDate',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'YYYY-MM-DD',
				displayOptions: { show: { resource: ['visit'], operation: ['update'] } },
			},
			{
				displayName: 'Scope',
				name: 'scope',
				type: 'options',
				options: [
					{ name: 'This Date Only', value: 'SINGLE' },
					{ name: 'This Date and All Following', value: 'SERIES' },
				],
				default: 'SINGLE',
				required: true,
				displayOptions: {
					show: {
						resource: ['visit'],
						operation: ['update', 'cancel'],
					},
				},
			},

			// Invoice
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: { show: { resource: ['invoice'], operation: ['create'] } },
				description: 'Major currency units (e.g. 120.5 for $120.50)',
			},
			{
				displayName: 'Line Description',
				name: 'description',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['invoice'], operation: ['create'] } },
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['invoice'], operation: ['create'] } },
			},
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['invoice'], operation: ['create'] } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['invoice'], operation: ['getAll'] } },
				description: 'Optional invoice status filter',
			},
		],
	};

	methods = {
		loadOptions: {
			async getClients(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const data = await spotCleanApiRequest.call(this, 'GET', '/clients', {}, { pageSize: 100 });
				return asItems(data).map((row) => {
					const id = String(row.id ?? '');
					return { name: labelForRecord(row, id), value: id };
				});
			},
			async getHouses(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const clientId = this.getCurrentNodeParameter('clientId') as string;
				if (!clientId) return [];
				const data = await spotCleanApiRequest.call(
					this,
					'GET',
					'/houses',
					{},
					{ clientId, pageSize: 100 },
				);
				return asItems(data).map((row) => {
					const id = String(row.id ?? '');
					return { name: labelForRecord(row, id), value: id };
				});
			},
			async getVisits(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const houseId = this.getCurrentNodeParameter('houseId') as string;
				if (!houseId) return [];
				const data = await spotCleanApiRequest.call(
					this,
					'GET',
					'/visits',
					{},
					{ houseId, pageSize: 100 },
				);
				return asItems(data).map((row) => {
					const id = String(row.id ?? '');
					const date = row.date ?? row.oneOffDate ?? '';
					const label = date ? `${date} (${id})` : id;
					return { name: String(label), value: id };
				});
			},
			async getInvoices(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const clientId = this.getCurrentNodeParameter('clientId') as string;
				const qs: IDataObject = { pageSize: 100 };
				if (clientId) qs.clientId = clientId;
				const data = await spotCleanApiRequest.call(this, 'GET', '/invoices', {}, qs);
				return asItems(data).map((row) => {
					const id = String(row.id ?? '');
					const amount = row.amount ?? '';
					const status = row.status ?? '';
					return { name: `${status} ${amount} (${id})`.trim(), value: id };
				});
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let response: unknown;

				if (resource === 'client') {
					response = await executeClient.call(this, operation, i);
				} else if (resource === 'house') {
					response = await executeHouse.call(this, operation, i);
				} else if (resource === 'visit') {
					response = await executeVisit.call(this, operation, i);
				} else if (resource === 'invoice') {
					response = await executeInvoice.call(this, operation, i);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex: i,
					});
				}

				const rows = Array.isArray(response) ? response : [response];
				for (const row of rows) {
					returnData.push({ json: (row ?? {}) as IDataObject, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

async function listPaged(
	this: IExecuteFunctions,
	path: string,
	itemIndex: number,
	extraQs: IDataObject = {},
): Promise<IDataObject[]> {
	const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
	const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
	if (!returnAll) {
		const data = await spotCleanApiRequest.call(this, 'GET', path, {}, {
			...extraQs,
			page: 1,
			pageSize: limit,
		});
		return asItems(data).slice(0, limit);
	}
	const all: IDataObject[] = [];
	let page = 1;
	const pageSize = 100;
	for (;;) {
		const data = (await spotCleanApiRequest.call(this, 'GET', path, {}, {
			...extraQs,
			page,
			pageSize,
		})) as IDataObject;
		const batch = asItems(data);
		all.push(...batch);
		const total = Number(data.total);
		if (!batch.length || (Number.isFinite(total) && all.length >= total) || batch.length < pageSize) {
			break;
		}
		page += 1;
		if (page > 100) break;
	}
	return all;
}

async function executeClient(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<unknown> {
	if (operation === 'getAll') {
		const q = this.getNodeParameter('q', i, '') as string;
		return listPaged.call(this, '/clients', i, omitEmpty({ q }));
	}
	if (operation === 'get') {
		const id = this.getNodeParameter('clientId', i) as string;
		return spotCleanApiRequest.call(this, 'GET', `/clients/${encodeURIComponent(id)}`);
	}
	if (operation === 'create') {
		const body = omitEmpty({
			nickname: this.getNodeParameter('nickname', i) as string,
			ownerPhone: this.getNodeParameter('ownerPhone', i) as string,
			ownerName: this.getNodeParameter('ownerName', i, '') as string,
			ownerEmail: this.getNodeParameter('ownerEmail', i, '') as string,
			houseName: this.getNodeParameter('houseName', i, '') as string,
			houseAddress: this.getNodeParameter('houseAddress', i) as string,
			addressComplement: this.getNodeParameter('addressComplement', i, '') as string,
		});
		return spotCleanApiRequest.call(this, 'POST', '/clients', body);
	}
	if (operation === 'update') {
		const id = this.getNodeParameter('clientId', i) as string;
		const body = omitEmpty({
			nickname: this.getNodeParameter('nickname', i, '') as string,
			ownerName: this.getNodeParameter('ownerName', i, '') as string,
			ownerPhone: this.getNodeParameter('ownerPhone', i, '') as string,
			ownerEmail: this.getNodeParameter('ownerEmail', i, '') as string,
		});
		if (this.getNodeParameter('clearOwnerEmail', i, false) as boolean) {
			body.ownerEmail = null;
		}
		return spotCleanApiRequest.call(this, 'PATCH', `/clients/${encodeURIComponent(id)}`, body);
	}
	if (operation === 'delete') {
		const id = this.getNodeParameter('clientId', i) as string;
		return spotCleanApiRequest.call(this, 'DELETE', `/clients/${encodeURIComponent(id)}`);
	}
	throw new NodeOperationError(this.getNode(), `Unknown client operation: ${operation}`, {
		itemIndex: i,
	});
}

async function executeHouse(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<unknown> {
	if (operation === 'getAll') {
		const clientId = this.getNodeParameter('clientId', i) as string;
		const q = this.getNodeParameter('q', i, '') as string;
		return listPaged.call(this, '/houses', i, omitEmpty({ clientId, q }));
	}
	if (operation === 'get') {
		const id = this.getNodeParameter('houseId', i) as string;
		return spotCleanApiRequest.call(this, 'GET', `/houses/${encodeURIComponent(id)}`);
	}
	if (operation === 'create') {
		const body = omitEmpty({
			clientId: this.getNodeParameter('clientId', i) as string,
			name: this.getNodeParameter('name', i) as string,
			address: this.getNodeParameter('address', i) as string,
			addressComplement: this.getNodeParameter('addressComplement', i, '') as string,
			latitude: this.getNodeParameter('latitude', i, 0) as number,
			longitude: this.getNodeParameter('longitude', i, 0) as number,
		});
		// Don't send 0,0 as coords unless user set them — omit when both default 0 with empty feel is hard;
		// Zapier sends only when set. Treat 0 as "unset" for lat/lng.
		if (body.latitude === 0) delete body.latitude;
		if (body.longitude === 0) delete body.longitude;
		return spotCleanApiRequest.call(this, 'POST', '/houses', body);
	}
	if (operation === 'update') {
		const id = this.getNodeParameter('houseId', i) as string;
		const body = omitEmpty({
			name: this.getNodeParameter('name', i, '') as string,
			address: this.getNodeParameter('address', i, '') as string,
			addressComplement: this.getNodeParameter('addressComplement', i, '') as string,
			latitude: this.getNodeParameter('latitude', i, 0) as number,
			longitude: this.getNodeParameter('longitude', i, 0) as number,
		});
		if (body.latitude === 0) delete body.latitude;
		if (body.longitude === 0) delete body.longitude;
		return spotCleanApiRequest.call(this, 'PATCH', `/houses/${encodeURIComponent(id)}`, body);
	}
	if (operation === 'delete') {
		const id = this.getNodeParameter('houseId', i) as string;
		return spotCleanApiRequest.call(this, 'DELETE', `/houses/${encodeURIComponent(id)}`);
	}
	throw new NodeOperationError(this.getNode(), `Unknown house operation: ${operation}`, {
		itemIndex: i,
	});
}

async function executeVisit(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<unknown> {
	if (operation === 'getAll') {
		const houseId = this.getNodeParameter('houseId', i) as string;
		return listPaged.call(this, '/visits', i, { houseId });
	}
	if (operation === 'get') {
		const id = this.getNodeParameter('visitId', i) as string;
		return spotCleanApiRequest.call(this, 'GET', `/visits/${encodeURIComponent(id)}`);
	}
	if (operation === 'create') {
		const kind = this.getNodeParameter('kind', i) as string;
		const body = omitEmpty({
			houseId: this.getNodeParameter('houseId', i) as string,
			kind,
			date: this.getNodeParameter('date', i) as string,
			frequency:
				kind === 'RECURRING'
					? (this.getNodeParameter('frequency', i, 'WEEKLY') as string)
					: undefined,
			estimatedTime: this.getNodeParameter('estimatedTime', i, '') as string,
			flatAmount: this.getNodeParameter('flatAmount', i, 0) as number,
			flatDescription: this.getNodeParameter('flatDescription', i, '') as string,
			flatDurationMinutes: this.getNodeParameter('flatDurationMinutes', i, 0) as number,
		});
		if (body.flatAmount === 0) delete body.flatAmount;
		if (body.flatDurationMinutes === 0) delete body.flatDurationMinutes;
		return spotCleanApiRequest.call(this, 'POST', '/visits', body);
	}
	if (operation === 'update') {
		const id = this.getNodeParameter('visitId', i) as string;
		const body = omitEmpty({
			houseId: this.getNodeParameter('houseId', i) as string,
			fromDate: this.getNodeParameter('fromDate', i) as string,
			toDate: this.getNodeParameter('toDate', i) as string,
			scope: this.getNodeParameter('scope', i) as string,
			appointmentId: id,
		});
		return spotCleanApiRequest.call(this, 'PATCH', `/visits/${encodeURIComponent(id)}`, body);
	}
	if (operation === 'cancel') {
		const id = this.getNodeParameter('visitId', i) as string;
		const body = omitEmpty({
			houseId: this.getNodeParameter('houseId', i) as string,
			date: this.getNodeParameter('date', i) as string,
			scope: this.getNodeParameter('scope', i) as string,
			appointmentId: id,
		});
		return spotCleanApiRequest.call(
			this,
			'POST',
			`/visits/${encodeURIComponent(id)}/cancel`,
			body,
		);
	}
	throw new NodeOperationError(this.getNode(), `Unknown visit operation: ${operation}`, {
		itemIndex: i,
	});
}

async function executeInvoice(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<unknown> {
	if (operation === 'getAll') {
		const clientId = this.getNodeParameter('clientId', i, '') as string;
		const status = this.getNodeParameter('status', i, '') as string;
		return listPaged.call(this, '/invoices', i, omitEmpty({ clientId, status }));
	}
	if (operation === 'get') {
		const id = this.getNodeParameter('invoiceId', i) as string;
		return spotCleanApiRequest.call(this, 'GET', `/invoices/${encodeURIComponent(id)}`);
	}
	if (operation === 'create') {
		const body = omitEmpty({
			clientId: this.getNodeParameter('clientId', i) as string,
			houseId: this.getNodeParameter('houseId', i, '') as string,
			amount: this.getNodeParameter('amount', i) as number,
			description: this.getNodeParameter('description', i, '') as string,
			currency: this.getNodeParameter('currency', i, '') as string,
			notes: this.getNodeParameter('notes', i, '') as string,
		});
		return spotCleanApiRequest.call(this, 'POST', '/invoices', body);
	}
	if (operation === 'markPaid') {
		const id = this.getNodeParameter('invoiceId', i) as string;
		return spotCleanApiRequest.call(
			this,
			'POST',
			`/invoices/${encodeURIComponent(id)}/mark-paid`,
			{},
		);
	}
	if (operation === 'delete') {
		const id = this.getNodeParameter('invoiceId', i) as string;
		return spotCleanApiRequest.call(this, 'DELETE', `/invoices/${encodeURIComponent(id)}`);
	}
	throw new NodeOperationError(this.getNode(), `Unknown invoice operation: ${operation}`, {
		itemIndex: i,
	});
}
