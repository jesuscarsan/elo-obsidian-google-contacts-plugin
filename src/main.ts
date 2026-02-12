import { Plugin, Platform } from 'obsidian';
import { GoogleContactPluginSettings, DEFAULT_SETTINGS } from './Infrastructure/Obsidian/settings';
import { SyncGoogleContactsCommand } from './Infrastructure/Presentation/Obsidian/Commands/SyncGoogleContactsCommand';
import { ProcessUnsyncedGoogleContactsCommand } from './Infrastructure/Presentation/Obsidian/Commands/ProcessUnsyncedGoogleContactsCommand';
import { SettingsView } from './Infrastructure/Presentation/Obsidian/Views/SettingsView';
import {
	ObsidianNoteRepository,
	ObsidianTranslationAdapter,
	TranslationService,
} from '@elo/obsidian-plugin';
import { ObsidianUIServiceAdapter } from './Infrastructure/Adapters/Obsidian/ObsidianUIServiceAdapter';
import { GoogleContactAdapter } from './Infrastructure/Adapters/Google/GoogleContactAdapter';
import { SyncContactUseCase } from './Application/UseCases/SyncContactUseCase';
import { GoogleContactTransformer } from './Domain/GoogleContactTransformer';
import en from './I18n/locales/en';
import es from './I18n/locales/es';

export default class EloGoogleContactsPlugin extends Plugin {
	settings: GoogleContactPluginSettings = DEFAULT_SETTINGS;
	googleAdapter!: GoogleContactAdapter;
	syncContactUseCase!: SyncContactUseCase;
	public translationService!: TranslationService;

	async onload() {
		console.log(`Elocuency Google Contacts plugin loaded ${this.manifest.version}`);

		await this.loadSettings();

		// --- I18n ---
		this.translationService = new ObsidianTranslationAdapter({ en, es });

		// --- Infrastructure (Adapters) ---

		this.googleAdapter = new GoogleContactAdapter(
			this.settings,
			this.saveSettings.bind(this), // Adapter needs saveSettings based on current impl
		);

		const noteRepo = new ObsidianNoteRepository(this.app);
		const uiService = new ObsidianUIServiceAdapter(this.app);
		const transformer = new GoogleContactTransformer();

		// --- Application (Use Cases) ---
		this.syncContactUseCase = new SyncContactUseCase(
			noteRepo,
			uiService,
			this.googleAdapter,
			transformer,
		);

		// --- Commands ---
		// TODO: Refactor existing commands to use UseCases instead of deprecated services/adapters directly where possible
		// For now, keeping existing commands but injecting what they need.
		// SyncGoogleContactsCommand likely needs the UseCase now.

		const syncGoogleCommand = new SyncGoogleContactsCommand(this.app, this);
		this.addCommand({
			id: syncGoogleCommand.id,
			name: syncGoogleCommand.name,
			callback: () => syncGoogleCommand.execute(),
		});

		const processUnsyncedCommand = new ProcessUnsyncedGoogleContactsCommand(this.app, this);
		this.addCommand({
			id: processUnsyncedCommand.id,
			name: processUnsyncedCommand.name,
			callback: () => processUnsyncedCommand.execute(),
		});

		// --- Settings ---
		this.addSettingTab(new SettingsView(this.app, this));
	}

	onunload() {
		console.log('Elocuency Google Contacts plugin unloaded');
	}

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	async saveSettings() {
		await this.saveData(this.settings);

		// GoogleAdapter shares same settings object reference so it should see updates
		// but if it needs explicit update we might need to call it.
		// Current GoogleAdapter references the settings object passed in constructor.
	}
}
