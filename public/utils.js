import { state } from './state.js';

export function addMessageToChat(role, content, format = true) {
    const messageElement = createMessageElement(role);
    updateMessageContent(messageElement, content, format);
}

export function createMessageElement(role) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${role}-message`);
    return messageElement;
}

export function updateMessageContent(messageElement, content, format = true) {
    if (format) {
        const formattedContent = formatMessage(content);
        messageElement.innerHTML = formattedContent;
    } else {
        messageElement.textContent = DOMPurify.sanitize(content);
    }

    // Append the message element to the chat messages container
    state.chatMessages.appendChild(messageElement);

    // Scroll the last message into view
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function formatMessage(content) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let formattedContent = content.replace(codeBlockRegex, (match, language, code) => {
        language = language || 'plaintext';
        const highlightedCode = hljs.highlight(code.trim(), { language: language }).value;
        const escapedCode = DOMPurify.sanitize(highlightedCode);
        return `<pre><div class="code-header"><span class="code-language">${language}</span><button class="copy-button">&#128190;</button></div><code class="hljs ${language}">${escapedCode}</code></pre>`;
    });

    // Format inline code
    formattedContent = formattedContent.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    return DOMPurify.sanitize(marked.parse(formattedContent));
}