const handlers = {};

const handler = {
    set(target, property, value) {
        target[property] = value;
        if (handlers[property]) {
            handlers[property](value);
        }
        return true;
    }
};

export const state = new Proxy({
    systemPrompt: 'You are a helpful assistant called MAX.',
    temperature: 0.7,
    messages: [
        { role: 'system', content: '' },
    ],
    selectedConversationId: null,
    chatMessages: null,
    onChange(property, callback) {
        handlers[property] = callback;
    }
}, handler);

// Funzioni per aggiornare lo stato
export function setSystemPrompt(prompt) {
    state.systemPrompt = prompt;
}

export function setTemperature(temp) {
    state.temperature = temp;
}

export function setMessages(messages) {
    state.messages = messages;
}

export function setSelectedConversationId(id) {
    state.selectedConversationId = id;
}

export function setChatMessages(element) {
    state.chatMessages = element;
}