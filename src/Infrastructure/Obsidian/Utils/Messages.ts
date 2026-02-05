import { Notice } from 'obsidian';

export function showMessage(message: string) {
  console.log("Msg:", message);
  new Notice(message, 5000);
}
