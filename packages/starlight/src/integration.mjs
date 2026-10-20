import { fileURLToPath } from 'node:url';
import { packagePaths, serializableConfig } from './config.mjs';

export const CONFIG_MODULE = 'virtual:tech0ver/config';
const RESOLVED_CONFIG_MODULE = `\0${CONFIG_MODULE}`;

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
			return id === CONFIG_MODULE ? RESOLVED_CONFIG_MODULE : undefined;
		},
		load(id) {
			return id === RESOLVED_CONFIG_MODULE ? code : undefined;
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
			},
		},
	};
}

export function packageFileUrl(path) {
	return fileURLToPath(new URL(path, import.meta.url));
}
