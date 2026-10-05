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
		data?: { verify_id?: string }
	}

	if (result.error) {
		return { error: result.error.message || 'Sign up failed' }
	}

	if (result.status !== true || typeof result.data?.verify_id !== 'string' || !result.data.verify_id) {
		return { error: 'Sign up failed. The service returned an invalid response.' }
	}

	return { verify_id: result.data.verify_id }
}
