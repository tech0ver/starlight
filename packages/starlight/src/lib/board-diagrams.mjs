const paths = {
	prev: 'm11.29 12 3.54-3.54a1 1 0 0 0 0-1.41 1 1 0 0 0-1.42 0l-4.24 4.24a1 1 0 0 0 0 1.42L13.41 17a1 1 0 0 0 .71.29 1 1 0 0 0 .71-.29 1 1 0 0 0 0-1.41Z',
	next: 'm14.83 11.29-4.24-4.24a1 1 0 1 0-1.42 1.41L12.71 12l-3.54 3.54a1 1 0 0 0 0 1.41 1 1 0 0 0 .71.29 1 1 0 0 0 .71-.29l4.24-4.24a1.002 1.002 0 0 0 0-1.42Z',
};

export function initializeBoardDiagrams() {
	for (const figure of document.querySelectorAll('.sk-slides:not([data-initialized])')) {
		const svg = figure.querySelector('.sk-svg');
		const scroll = figure.querySelector('.sk-scroll');
		const caption = figure.querySelector('.sk-caption');
		const controls = figure.querySelector('.sk-controls');
		let labels;
		try { labels = JSON.parse(svg.getAttribute('data-steps')); } catch { continue; }
		if (!Array.isArray(labels) || !labels.length || !svg.getAttribute('data-final')) continue;
		figure.dataset.initialized = '';
		const views = [...labels, svg.getAttribute('data-final')];
		const elements = [...svg.querySelectorAll('.sk-el')];
		let current = 1;
		const makeButton = (label, text, target, icon) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.setAttribute('aria-label', label);
			button.dataset.go = target;
			if (icon) {
				const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
				symbol.setAttribute('viewBox', '0 0 24 24');
				symbol.setAttribute('aria-hidden', 'true');
				const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
				path.setAttribute('d', paths[icon]);
				symbol.append(path); button.append(symbol);
			} else { button.textContent = text; button.className = target === String(views.length) ? 'sk-all' : 'sk-num'; }
			return button;
		};
		controls.append(makeButton('Previous view', '', 'prev', 'prev'));
		const viewButtons = document.createElement('div');
		viewButtons.className = 'sk-view-buttons';
		views.forEach((label, i) => viewButtons.append(makeButton(label, i === labels.length ? 'All' : String(i + 1), String(i + 1))));
		controls.append(viewButtons);
		controls.append(makeButton('Next view', '', 'next', 'next'));
		const show = (step) => {
			current = Math.max(1, Math.min(step, views.length));
			for (const element of elements) {
				const elementStep = Number(element.getAttribute('data-step') || 1);
				element.dataset.state = current === views.length ? 'all' : elementStep < current ? 'old' : elementStep === current ? 'new' : 'hidden';
			}
			caption.textContent = views[current - 1];
			for (const button of controls.querySelectorAll('button')) {
				const target = button.dataset.go;
				if (target === 'prev') button.disabled = current === 1;
				else if (target === 'next') button.disabled = current === views.length;
				else if (Number(target) === current) button.setAttribute('aria-current', 'step');
				else button.removeAttribute('aria-current');
			}
			const selected = viewButtons.querySelector('[aria-current="step"]');
			const bounds = selected.getBoundingClientRect();
			const viewport = viewButtons.getBoundingClientRect();
			if (bounds.right > viewport.right) viewButtons.scrollLeft += bounds.right - viewport.right;
			else if (bounds.left < viewport.left) viewButtons.scrollLeft -= viewport.left - bounds.left;
		};
		controls.addEventListener('click', (event) => {
			const button = event.target.closest('button');
			if (!button || !controls.contains(button)) return;
			const target = button.dataset.go;
			show(target === 'prev' ? current - 1 : target === 'next' ? current + 1 : Number(target));
			if (button.disabled) viewButtons.querySelector('[aria-current="step"]').focus();
		});
		controls.addEventListener('keydown', (event) => {
			if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
			event.preventDefault();
			const focused = document.activeElement;
			show(current + (event.key === 'ArrowLeft' ? -1 : 1));
			if (focused.disabled) viewButtons.querySelector('[aria-current="step"]').focus();
		});
		scroll.addEventListener('keydown', (event) => {
			const keys = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 1, End: views.length };
			if (!(event.key in keys)) return;
			event.preventDefault(); show(keys[event.key]);
		});
		controls.hidden = false; show(1);
	}
}
