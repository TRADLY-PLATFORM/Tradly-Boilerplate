export type ParsedSignUpResponse =
	| { verify_id: string }
	| { error: string }

export const parseSignUpResponse = (response: unknown): ParsedSignUpResponse => {
	if (response instanceof Error) {
		return {
			error: 'Unable to contact the sign-up service. Check your connection and try again.',
		}
	}

	if (!response || typeof response !== 'object') {
		return { error: 'Sign up failed. The service returned an invalid response.' }
	}

	const result = response as {
		status?: boolean
		error?: { message?: string }
		data?: { verify_id?: string | number }
	}

	if (result.error) {
		return { error: result.error.message || 'Sign up failed' }
	}

	const rawVerifyId = result.data?.verify_id
	if (result.status !== true || rawVerifyId === undefined || rawVerifyId === null || rawVerifyId === '') {
		return { error: 'Sign up failed. The service returned an invalid response.' }
	}

	return { verify_id: String(rawVerifyId) }
}
