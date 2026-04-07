import pinoHttp from 'pino-http';
import type { Request } from 'express';
import type { User } from '../types/user';

import { logger } from '../utils/logger';

export const requestLogger = pinoHttp({
	logger,
	customLogLevel(_req, res, err) {
		if (err || res.statusCode >= 500) {
			return 'error';
		}
		if (res.statusCode >= 400) {
			return 'warn';
		}
		return 'info';
	},
	customProps(req, res) {
		const expressReq = req as unknown as Request & { requestId?: string; user?: User };
		const user = expressReq.user;
		return {
			request_id: expressReq.requestId,
			user_id: user?.id,
			route: expressReq.originalUrl,
			method: expressReq.method,
			status_code: res.statusCode
		};
	},
	serializers: {
		req(req) {
			return {
				id: req.id,
				method: req.method,
				url: req.url,
				remoteAddress: req.remoteAddress
			};
		},
		res(res) {
			return {
				statusCode: res.statusCode
			};
		}
	}
});
