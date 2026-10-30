import { fileURLToPath } from 'node:url';
import { packagePaths, serializableConfig } from './config.mjs';

export const CONFIG_MODULE = 'virtual:tech0ver/config';
const RESOLVED_CONFIG_MODULE = `\0${CONFIG_MODULE}`;
export const LAYOUT_MODULE = 'virtual:tech0ver/layout.css';
const RESOLVED_LAYOUT_MODULE = `\0${LAYOUT_MODULE}`;
const SIDEBAR_MODULE = 'virtual:tech0ver/sidebar';

/**
 * Each call creates a new Vite plugin. The generated module belongs to one
 * Astro config and is never stored in package-level mutable state.
 */
export function createConfigVirtualModule(config) {
	const code = `export default ${JSON.stringify(serializableConfig(config))};`;
	return {
		name: 'tech0ver-starlight-config',
		enforce: 'pre',
		resolveId(id) {
			if (id === CONFIG_MODULE) return RESOLVED_CONFIG_MODULE;
			if (id === LAYOUT_MODULE) return RESOLVED_LAYOUT_MODULE;
			if (id === SIDEBAR_MODULE) return `\0${SIDEBAR_MODULE}`;
		},
		load(id) {
			if (id === RESOLVED_CONFIG_MODULE) return code;
			if (id === RESOLVED_LAYOUT_MODULE) return `:root { --site-left-sidebar-width: ${config.sidebarWidth}px; }`;
			// Starlight has no public sidebar builder. Use the installed, pinned
			// version so automatic groups and plugin config match the site's menu.
			if (id === `\0${SIDEBAR_MODULE}`) {
				const navigation = new URL('./utils/navigation.js', import.meta.resolve('@astrojs/starlight'));
				return `export { getSidebar } from ${JSON.stringify(fileURLToPath(navigation))};`;
			}
		},
	};
}

export function createTech0verPlugin(config) {
	return {
		name: '@tech0ver/starlight',
		hooks: {
			'config:setup': ({ addRouteMiddleware }) => {
				addRouteMiddleware({ entrypoint: packagePaths.routeData, order: 'post' });
			},
		},
	};
}

export function createRawMarkdownIntegration(entrypoint) {
	return {
		name: '@tech0ver/starlight/raw-markdown',
		hooks: {
			'astro:config:setup': ({ injectRoute }) => {
				injectRoute({
					pattern: '[...article].md',
					entrypoint,
					prerender: true,
				});
				injectRoute({
					pattern: 'llms.txt',
					entrypoint: packagePaths.llms,
					prerender: true,
				});
			},
		},
	};
}

export function packageFileUrl(path) {
	return fileURLToPath(new URL(path, import.meta.url));
}
