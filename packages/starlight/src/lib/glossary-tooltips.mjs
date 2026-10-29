let cleanup;

export function initializeGlossaryTooltips() {
	cleanup?.();
	const terms = [...document.querySelectorAll('.sl-markdown-content .term')];
	if (!terms.length) return;
	const controller = new AbortController();
	const { signal } = controller;
	let current;
	let frame;
	const label = (term) => term.querySelector('.term-label');
	const position = () => {
		if (!current) return;
		const tip = current.querySelector('.term-tip');
		tip.style.removeProperty('--term-tip-offset');
		tip.style.removeProperty('--term-tip-max-height');
		current.removeAttribute('data-above');
		if (!matchMedia('(min-width: 72rem)').matches) return;
		const trigger = label(current).getBoundingClientRect();
		const above = trigger.top - Math.max(8, document.querySelector('header')?.getBoundingClientRect().bottom ?? 8) - 8;
		const below = innerHeight - trigger.bottom - 8;
		const placeAbove = tip.getBoundingClientRect().height > below && above > below;
		current.toggleAttribute('data-above', placeAbove);
		tip.style.setProperty('--term-tip-max-height', `${Math.max(44, (placeAbove ? above : below) - 8)}px`);
		const bounds = tip.getBoundingClientRect();
		const width = document.documentElement.clientWidth;
		const offset = Math.max(8 - bounds.left, Math.min(0, width - 8 - bounds.right));
		tip.style.setProperty('--term-tip-offset', `${offset}px`);
	};
	const close = (restoreFocus = false) => {
		if (!current) return;
		const term = current;
		// Restore focus before closing so focusin cannot reopen the dismissed card.
		if (restoreFocus && term.querySelector('.term-tip').contains(document.activeElement)) label(term).focus({ preventScroll: true });
		term.removeAttribute('data-open');
		label(term).setAttribute('aria-expanded', 'false');
		current = undefined;
	};
	const open = (term) => {
		if (current !== term) close();
		current = term;
		term.setAttribute('data-open', '');
		label(term).setAttribute('aria-expanded', 'true');
		position();
	};
	for (const term of terms) {
		term.setAttribute('data-enhanced', '');
		term.querySelector('.term-tip-close').hidden = false;
		term.addEventListener('pointerenter', (event) => {
			if (event.pointerType === 'mouse') open(term);
		}, { signal });
		term.addEventListener('pointerleave', (event) => {
			if (event.pointerType === 'mouse' && current === term && !term.contains(document.activeElement)) close();
		}, { signal });
		term.addEventListener('focusin', () => open(term), { signal });
		term.addEventListener('focusout', (event) => {
			if (!term.contains(event.relatedTarget) && current === term) close();
		}, { signal });
		label(term).addEventListener('click', () => open(term), { signal });
		label(term).addEventListener('keydown', (event) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				open(term);
			}
		}, { signal });
		term.querySelector('.term-tip-close').addEventListener('click', () => close(true), { signal });
	}
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && current) {
			event.preventDefault();
			close(true);
		}
	}, { signal });
	document.addEventListener('pointerdown', (event) => {
		if (current && !current.contains(event.target)) close();
	}, { signal });
	window.addEventListener('resize', position, { signal });
	window.addEventListener('scroll', () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(position);
	}, { signal, passive: true });
	cleanup = () => {
		close();
		controller.abort();
		cancelAnimationFrame(frame);
	};
}
