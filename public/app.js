import { initializeMainPage } from './components/mainPage.js';
import { initializeSettingsSidebar } from './components/settingsSidebar.js';
import { initializeConversationsSidebar } from './components/conversationsSidebar.js';
import { setChatMessages, state } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    setChatMessages(document.getElementById('chatMessages'));
    
    initializeMainPage();
    initializeSettingsSidebar();
    initializeConversationsSidebar();

    // Disable user input if no conversation is selected
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const checkConversationSelected = (_newState) => {
        if (state.selectedConversationId) {
            userInput.disabled = false;
            sendButton.disabled = false;
        } else {
            userInput.disabled = true;
            sendButton.disabled = true;
        }
    };

    // Check conversation selection on load and when state changes
    checkConversationSelected();
    state.onChange('selectedConversationId', checkConversationSelected);
});

