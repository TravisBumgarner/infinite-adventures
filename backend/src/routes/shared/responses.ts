import type { Response } from "express";
import type { ErrorCode } from "shared";

export function sendSuccess<T>(_res: Response, _data: T, _status = 200): void {}

export function sendError(_res: Response, _errorCode: ErrorCode, _status: number): void {}

export function sendUnauthorized(_res: Response): void {}

export function sendForbidden(_res: Response): void {}

export function sendNotFound(_res: Response, _errorCode?: ErrorCode): void {}

export function sendBadRequest(_res: Response, _errorCode?: ErrorCode): void {}

export function sendInternalError(_res: Response): void {}
