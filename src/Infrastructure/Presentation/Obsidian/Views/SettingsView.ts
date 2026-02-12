
import { App, PluginSettingTab, Setting } from 'obsidian';
import EloGoogleContactsPlugin from '../../../../main';

export class SettingsView extends PluginSettingTab {
    plugin: EloGoogleContactsPlugin;

    constructor(app: App, plugin: EloGoogleContactsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Elocuency Google Contacts Settings' });

        new Setting(containerEl)
            .setName('Google Client ID')
            .setDesc('OAuth 2.0 Client ID')
            .addText(text => text
                .setPlaceholder('Enter your Client ID')
                .setValue(this.plugin.settings.googleClientId)
                .onChange(async (value) => {
                    this.plugin.settings.googleClientId = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Google Client Secret')
            .setDesc('OAuth 2.0 Client Secret')
            .addText(text => text
                .setPlaceholder('Enter your Client Secret')
                .setValue(this.plugin.settings.googleClientSecret)
                .onChange(async (value) => {
                    this.plugin.settings.googleClientSecret = value;
                    await this.plugin.saveSettings();
                }));


    }
}
