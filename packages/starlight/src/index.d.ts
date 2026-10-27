import type { AstroUserConfig } from 'astro';
import type { StarlightPlugin, StarlightUserConfig } from '@astrojs/starlight/types';

export interface GlossaryEntry {
	id: string;
	term: string;
	aliases?: string[];
	expansion?: string;
	short: string;
	explanation: string;
	readMore?: { href: string; label: string };
	explainedIn?: string[];
}

export type CalloutKind = 'do' | 'tradeoff' | 'explain' | 'avoid' | 'distinguish';
export type CalloutLabels = Partial<Record<CalloutKind, string>>;

export interface ReadingOptions {
	enabled?: boolean;
	/** Keep this project key unchanged across releases and base path changes. */
	storageKey?: string;
	labels?: Partial<Record<'markAsRead' | 'addFavorite' | 'removeFavorite' | 'new' | 'seen' | 'read', string>>;
}

export interface Tech0verOptions extends Omit<AstroUserConfig, 'base' | 'integrations' | 'markdown'> {
	base?: string;
	integrations?: AstroUserConfig['integrations'];
	title?: string;
	brand?: { name?: string; suffix?: string };
	/** Width of the desktop sidebar and tablet drawer in pixels. Defaults to 200. */
	sidebarWidth?: number;
	reading?: ReadingOptions;
	callouts?: CalloutLabels;
	plannedTopics?: Record<string, string[]>;
	plannedTopLevel?: string[];
	searchSuggestions?: Array<{ href: string; label: string; description?: string }>;
	search?: { suggestions?: Array<{ href: string; label: string; description?: string }> };
	footer?: {
		text?: string;
		copyright?: string;
		links?: Array<{ href: string; label: string }>;
	};
	socialImage?: string;
	socialImageAlt?: string;
	glossary?: {
		entries?: GlossaryEntry[];
		skip?: string[];
		route?: string | false;
	};
	diagrams?: { directory?: URL | string };
	tutor?: { enabled?: boolean; title?: string; intro?: string };
	rawMarkdown?: { enabled?: boolean };
	starlight?: Omit<Partial<StarlightUserConfig>, 'favicon'> & { plugins?: StarlightPlugin[] };
	mdastPlugins?: unknown[];
	hastPlugins?: unknown[];
	markdown?: AstroUserConfig['markdown'] & { mdastPlugins?: unknown[]; hastPlugins?: unknown[]; features?: Record<string, boolean> };
}

export declare function defineTech0verConfig(input?: Tech0verOptions): AstroUserConfig;
export declare function normalizeTech0verOptions(input?: Tech0verOptions): {
	base: string;
	brand: { name: string; suffix: string; fullName: string };
	sidebarWidth: number;
	reading: Required<Omit<ReadingOptions, 'labels'>> & { labels: Required<NonNullable<ReadingOptions['labels']>> };
	callouts: Record<CalloutKind, string>;
	plannedTopics: Record<string, string[]>;
	plannedTopLevel: string[];
	searchSuggestions: Array<{ href: string; label: string; description?: string }>;
	footer: Tech0verOptions['footer'];
	socialImage?: string;
	socialImageAlt: string;
	diagramDirectory?: URL;
	glossaryEntries: GlossaryEntry[];
	glossarySkip: string[];
	glossaryRoute: string | false;
	tutor: { enabled: boolean; title: string; intro: string };
	rawMarkdown: { enabled: boolean };
	starlight: Omit<Partial<StarlightUserConfig>, 'favicon'> & { plugins?: StarlightPlugin[] };
};
export declare function blocksPlugin(labels?: CalloutLabels): unknown;
export declare function diagramsPlugin(options?: { directory?: URL | string }): unknown;
export declare function glossaryPlugin(options?: { entries?: GlossaryEntry[]; skip?: string[]; base?: string; route?: string }): unknown;
export declare function articleMarkdown(options: {
	title: string;
	description?: string;
	body: string;
	renderedHtml?: string;
	articleUrl: URL;
	siteRoot: URL;
	glossary?: GlossaryEntry[];
	callouts?: CalloutLabels;
}): string;
