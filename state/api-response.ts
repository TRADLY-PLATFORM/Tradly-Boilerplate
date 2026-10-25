type TradlyErrorPayload = { message?: unknown; code?: unknown }

const isRecord = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * Returns a safe user-facing error for malformed or failed SDK responses.
 * Required keys are checked inside the SDK's `data` object before callers
 * unwrap it, so a missing envelope never becomes a secondary TypeError.
 */
export const getTradlyResponseError = (
	response: unknown,
	fallback: string,
	requiredDataKeys: readonly string[] = [],
): string | undefined => {
	if (response instanceof Error) {
		return 'Unable to contact the Tradly service. Check your connection and try again.'
	}

	if (!isRecord(response)) {
		return 'The Tradly service returned an invalid response. Please try again.'
	}

	const apiError = response.error
	if (apiError) {
		const payload = isRecord(apiError) ? apiError as TradlyErrorPayload : undefined
		return typeof payload?.message === 'string' && payload.message
			? payload.message
			: fallback
	}

	if (response.status === false) {
		return typeof response.message === 'string' && response.message
			? response.message
			: fallback
	}

	const data = response.data
	if (response.status !== true && !isRecord(data) && !Array.isArray(data)) {
		return 'The Tradly service returned an invalid response. Please try again.'
	}

	if (requiredDataKeys.some((key) => !isRecord(data) || data[key] === undefined || data[key] === null)) {
		return 'The Tradly service returned incomplete data. Please try again.'
	}

	return undefined
}

export const getThrownErrorMessage = (error: unknown, fallback: string): string =>
	error instanceof Error && error.message ? error.message : fallback

export const normalizeTradlyResponse = <T>(
	response: T,
	fallback: string,
	requiredDataKeys: readonly string[] = [],
	): T => {
	const message = getTradlyResponseError(response, fallback, requiredDataKeys)
	return message ? ({ error: { message } } as T) : response
}
