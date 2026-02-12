import { App, Modal, Setting } from 'obsidian';
import { showMessage } from '../../../Obsidian/Utils/Messages';
import { GoogleContactAdapter } from '../../../Adapters/Google/GoogleContactAdapter';

export class GoogleAuthModal extends Modal {
    adapter: GoogleContactAdapter;
    onSuccess: () => void;

    constructor(app: App, adapter: GoogleContactAdapter, onSuccess: () => void) {
        super(app);
        this.adapter = adapter;
        this.onSuccess = onSuccess;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Connect to Google Contacts' });
        contentEl.createEl('p', { text: 'You need to connect to Google to use this feature.' });

        // Step 1: Authorize
        const step1 = contentEl.createDiv({ cls: 'step-1' });
        step1.createEl('h3', { text: 'Step 1: Authorize' });
        step1.createEl('p', { text: 'Click the button below to open the validation page. You will be redirected to Google. Copy the URL or the code from the address bar after the redirect.' });

        new Setting(step1)
            .addButton(btn => btn
                .setButtonText('Connect Google')
                .setCta()
                .onClick(async () => {
                    btn.setDisabled(true);
                    btn.setButtonText('Opening Browser...');

                    // Using google.com as redirect URI to capture the code in the URL bar easily
                    const redirectUri = 'https://google.com';
                    const authUrl = this.adapter.generateAuthUrl(redirectUri);

                    if (authUrl) {
                        window.open(authUrl);
                        showMessage('Browser opened. Please login and copy the code.');
                        // Re-enable after a delay
                        setTimeout(() => {
                            btn.setDisabled(false);
                            btn.setButtonText('Connect Google (Retry)');
                        }, 5000);
                    } else {
                        showMessage('Failed to generate auth URL. Check Client ID.');
                        btn.setDisabled(false);
                        btn.setButtonText('Connect Google');
                    }
                }));

        // Step 2: Enter Code
        const step2 = contentEl.createDiv({ cls: 'step-2' });
        step2.createEl('h3', { text: 'Step 2: Enter Code' });

        let code = '';

        new Setting(step2)
            .setName('Authorization Code')
            .setDesc('Paste the code or the full redirect URL here.')
            .addText(text => text
                .setPlaceholder('Paste code or URL...')
                .onChange(value => {
                    code = value.trim();
                    // Try to extract code from URL if present
                    try {
                        if (code.includes('code=')) {
                            const url = new URL(code);
                            const extracted = url.searchParams.get('code');
                            if (extracted) {
                                code = extracted;
                            }
                        } else if (code.includes('&')) {
                            // Handle case where it might be just query params pasted
                            const params = new URLSearchParams(code);
                            const extracted = params.get('code');
                            if (extracted) {
                                code = extracted;
                            }
                        }
                    } catch (e) {
                        // Not a valid URL, treat as raw code
                    }
                }));

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Verify & Connect')
                .setCta()
                .onClick(async () => {
                    if (!code) {
                        showMessage('Please enter the code.');
                        return;
                    }

                    try {
                        const redirectUri = 'https://google.com'; // Consistent with step 1
                        btn.setButtonText('Verifying...');
                        btn.setDisabled(true);

                        const success = await this.adapter.finishAuthentication(code, redirectUri);

                        if (success) {
                            showMessage('Google Connected Successfully!');
                            this.onSuccess();
                            this.close();
                        } else {
                            showMessage('Failed to verify code.');
                            btn.setButtonText('Verify & Connect');
                            btn.setDisabled(false);
                        }

                    } catch (error) {
                        showMessage(`Failed to connect: ${(error as Error).message}`);
                        console.error(error);
                        btn.setButtonText('Verify & Connect');
                        btn.setDisabled(false);
                    }
                }));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
