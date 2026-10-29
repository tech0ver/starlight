/** Validate package-owned data while Astro and Starlight validate their own options. */
const fail = (path, message) => { throw new Error(`${path} ${message}`); };
const object = (value, path) => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'must be an object.');
};
const text = (value, path, allowEmpty = false) => {
	if (typeof value !== 'string' || (!allowEmpty && !value.trim())) fail(path, 'must be a non-empty string.');
};
const optionalText = (value, path, allowEmpty = false) => {
	if (value !== undefined) text(value, path, allowEmpty);
};
const boolean = (value, path) => {
	if (value !== undefined && typeof value !== 'boolean') fail(path, 'must be true or false.');
};
const array = (value, path, check) => {
	if (!Array.isArray(value)) fail(path, 'must be an array.');
	value.forEach((item, index) => check(item, `${path}[${index}]`));
};
const strings = (value, path) => array(value, path, text);
const href = (value, path, protocols = ['http:', 'https:']) => {
	text(value, path);
	try {
		if (value !== value.trim() || /[\u0000-\u0020\u007f]/.test(value)) throw new Error();
		const url = new URL(value, 'https://config.invalid/');
		if (!protocols.includes(url.protocol) || (/^https?:/i.test(value) && !/^https?:\/\/[^/]/i.test(value))) throw new Error();
	} catch { fail(path, `must be a site-relative link or a URL using ${protocols.join(', ')} without spaces.`); }
};
const link = (value, path, protocols) => {
	object(value, path);
	href(value.href, `${path}.href`, protocols);
	text(value.label, `${path}.label`);
	optionalText(value.description, `${path}.description`, true);
};
const headingId = (value, path) => {
	text(value, path);
	if (/[\s#]/u.test(value)) fail(path, 'must be a heading ID without # or spaces.');
};
const planned = (value, path) => array(value, path, (topic, itemPath) => {
	if (typeof topic === 'string') text(topic, itemPath);
	else {
		object(topic, itemPath);
		text(topic.label, `${itemPath}.label`);
		text(topic.slug, `${itemPath}.slug`);
		if (/[:?#\s]/u.test(topic.slug)) fail(`${itemPath}.slug`, 'must be a page path without a domain, query, or fragment.');
	}
});

export function validateTech0verOptions(input) {
	object(input, 'Tech0ver options');
	for (const name of ['brand', 'reading', 'callouts', 'plannedTopics', 'search', 'footer', 'glossary', 'diagrams', 'tutor', 'rawMarkdown']) {
		if (input[name] !== undefined) object(input[name], name);
	}
	if (input.brand) {
		optionalText(input.brand.name, 'brand.name');
		optionalText(input.brand.suffix, 'brand.suffix', true);
	}
	if (input.reading) {
		const reading = input.reading;
		boolean(reading.enabled, 'reading.enabled');
		if (reading.labels !== undefined) {
			object(reading.labels, 'reading.labels');
			for (const [name, value] of Object.entries(reading.labels)) text(value, `reading.labels.${name}`);
		}
	}
	if (input.callouts) {
		for (const [name, value] of Object.entries(input.callouts)) text(value, `callouts.${name}`);
	}
	if (input.plannedTopLevel !== undefined) planned(input.plannedTopLevel, 'plannedTopLevel');
	if (input.plannedTopics) {
		for (const [name, topics] of Object.entries(input.plannedTopics)) planned(topics, `plannedTopics.${name}`);
	}
	if (input.searchSuggestions !== undefined) array(input.searchSuggestions, 'searchSuggestions', link);
	if (input.search?.suggestions !== undefined) array(input.search.suggestions, 'search.suggestions', link);
	if (input.footer) {
		optionalText(input.footer.text, 'footer.text', true);
		optionalText(input.footer.copyright, 'footer.copyright', true);
		if (input.footer.links !== undefined) array(input.footer.links, 'footer.links', (value, path) => link(value, path, ['http:', 'https:', 'mailto:', 'tel:']));
	}
	optionalText(input.socialImageAlt, 'socialImageAlt', true);
	if (input.socialImage !== undefined) href(input.socialImage, 'socialImage');
	if (input.glossary) {
		const glossary = input.glossary;
		if (glossary.route !== undefined && glossary.route !== false) text(glossary.route, 'glossary.route');
		if (glossary.skip !== undefined) strings(glossary.skip, 'glossary.skip');
		if (glossary.entries !== undefined) {
			const ids = new Set();
			array(glossary.entries, 'glossary.entries', (entry, path) => {
				object(entry, path);
				headingId(entry.id, `${path}.id`);
				if (ids.has(entry.id)) fail(`${path}.id`, `duplicates glossary ID "${entry.id}".`);
				ids.add(entry.id);
				for (const name of ['term', 'short', 'explanation']) text(entry[name], `${path}.${name}`);
				optionalText(entry.expansion, `${path}.expansion`);
				if (entry.aliases !== undefined) strings(entry.aliases, `${path}.aliases`);
				if (entry.explainedIn !== undefined) strings(entry.explainedIn, `${path}.explainedIn`);
				if (entry.readMore !== undefined) link(entry.readMore, `${path}.readMore`);
			});
		}
	}
	for (const name of ['tutor', 'rawMarkdown']) {
		if (input[name]) boolean(input[name].enabled, `${name}.enabled`);
	}
	if (input.tutor) {
		optionalText(input.tutor.title, 'tutor.title');
		optionalText(input.tutor.intro, 'tutor.intro');
	}
	if (input.diagrams?.directory !== undefined && !(input.diagrams.directory instanceof URL)) text(input.diagrams.directory, 'diagrams.directory');
}
