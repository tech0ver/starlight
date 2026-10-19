/** Semantic kinds and colors stay shared; consumers may rename their labels. */
export const defaultCalloutLabels = Object.freeze({
	do: 'What to do',
	tradeoff: 'Trade-off',
	interview: 'In the interview',
	avoid: 'Avoid',
	distinguish: 'Do not confuse',
});

export function resolveCalloutLabels(overrides = {}) {
	return Object.fromEntries(Object.entries(defaultCalloutLabels).map(([kind, label]) => [
		kind,
		typeof overrides[kind] === 'string' ? overrides[kind] : label,
	]));
}
