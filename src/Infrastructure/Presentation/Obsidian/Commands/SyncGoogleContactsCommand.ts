import { App, TFile, getAllTags } from 'obsidian';
import { GoogleAuthModal } from '../Views/GoogleAuthModal';
import { executeInEditMode, getActiveMarkdownView } from '../../../Obsidian/Utils/ViewMode';
import EloGoogleContactsPlugin from '../../../../main';
import { showMessage } from '@elo/obsidian-plugin';

export class SyncGoogleContactsCommand {
	id: string = 'elo-sync-google-contacts';
	name: string;

	constructor(
		private app: App,
		private plugin: EloGoogleContactsPlugin,
	) {
		this.name = this.plugin.translationService.t('command.syncActiveNote');
	}

	async execute(file?: TFile): Promise<void> {
		const targetFile = file || this.app.workspace.getActiveFile();

		if (!targetFile || !(targetFile instanceof TFile)) {
			showMessage('contacts.noActiveFile', undefined, this.plugin.translationService);
			return;
		}

		if (!this.isPersona(targetFile)) {
			showMessage('contacts.notAPerson', undefined, this.plugin.translationService);
			return;
		}

		const view = getActiveMarkdownView(this.app, targetFile);
		if (!view) {
			// This one doesn't have a key but it's an error message
			showMessage('Not could not obtain note view for edit mode.');
			return;
		}

		await executeInEditMode(view, async () => {
			showMessage(
				'contacts.syncing',
				{ name: targetFile.basename },
				this.plugin.translationService,
			);
			try {
				await this.plugin.syncContactUseCase.syncNoteWithGoogle(targetFile.path);
				showMessage(
					'contacts.syncComplete',
					{ name: targetFile.basename },
					this.plugin.translationService,
				);
			} catch (e) {
				console.error(`Error syncing ${targetFile.basename}:`, e);
				// Check if error is related to auth
				const msg = (e as Error).message;
				if (
					msg.includes('Refresh Token is missing') ||
					msg.includes('No Google tokens') ||
					msg.includes('401') ||
					msg.includes('403') ||
					msg.includes('invalid_grant') ||
					msg.includes('Token has been expired')
				) {
					showMessage('contacts.authRequired', undefined, this.plugin.translationService);
					new GoogleAuthModal(this.app, this.plugin.googleAdapter, async () => {
						// On Success, retry? Or just notify.
						showMessage('contacts.authSuccess', undefined, this.plugin.translationService);
					}).open();
				} else {
					showMessage('contacts.syncError', { error: msg }, this.plugin.translationService);
				}
			}
		});
	}

	private isPersona(file: TFile): boolean {
		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache) return false;

		const tags = getAllTags(cache);
		// console.log("tags:", tags);
		if (tags && tags.some((t) => t.startsWith('#Personas/'))) {
			return true;
		}
		return false;
	}
}
