import { state, setMessages } from '../state.js';
import { updateMessageContent, createMessageElement, addMessageToChat } from '../utils.js';

export function initializeMainPage() {
    const modelSelector = document.getElementById('modelSelector');
    const modelSummary = document.getElementById('modelSummary');
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const themeToggleButton = document.getElementById('themeToggleButton');
    const downloadChatButton = document.getElementById('downloadChatButton'); // Aggiungi questo

    let selectedModel = '';
    let currentBotMessageElement = null;

    // EVENT LISTENERS
    themeToggleButton.addEventListener('click', toggleTheme);
    modelSelector.addEventListener('change', (e) => {
        selectedModel = e.target.value;
        fetchModel(selectedModel);
    });
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    chatMessages.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-button')) {
            const codeElement = e.target.closest('pre').querySelector('code');
            const codeText = codeElement.textContent;

            navigator.clipboard.writeText(codeText)
                .then(() => {
                    e.target.textContent = 'Copied!';
                    setTimeout(() => {
                        e.target.textContent = 'Copy';
                    }, 1500);
                })
                .catch(err => {
                    console.error('Failed to copy code: ', err);
                });
        }
    });

    downloadChatButton.addEventListener('click', downloadChat); // Aggiungi questo

    fetchModels();

    function fetchModel(selectedModel) {
        fetch('http://localhost:3000/api/ollama/model?name=' + selectedModel)
            .then(response => response.json())
            .then(data => {
                if (data) {
                    console.log('Modello LLM corrente: ', data);
                    const { family, parameter_size, quantization_level } = data.details;
                    modelSummary.innerHTML = `
                    <span>Model:</span> 
                    <strong> ${selectedModel} </strong> - 
                    <span>Family:</span> 
                    <strong> ${family} </strong> - 
                    <span>Size:</span> 
                    <strong> ${parameter_size} </strong> - 
                    <span>Quantization level:</span> 
                    <strong> ${quantization_level} </strong>`;
                } else {
                    throw new Error('Unexpected format for models data');
                }
            })
            .catch(error => {
                console.error('Error fetching models:', error);
                addMessageToChat('assistant', 'Error loading models. Please try again later.', false);
            });
    }

    function fetchModels() {
        fetch('http://localhost:3000/api/ollama/models')
            .then(response => response.json())
            .then(data => {
                if (data.models && Array.isArray(data.models)) {
                    data.models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.name;
                        option.textContent = model.name;
                        modelSelector.appendChild(option);
                    });
                    selectedModel = data.models[0].name; // Default to the first model
                    modelSelector.value = selectedModel;
                    fetchModel(selectedModel);
                } else {
                    throw new Error('Unexpected format for models data');
                }
            })
            .catch(error => {
                console.error('Error fetching models:', error);
                addMessageToChat('assistant', 'Error loading models. Please try again later.', false);
            });
    }

    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addMessageToChat('user', message, true);
            userInput.value = '';

            setMessages([...state.messages, { role: 'user', content: message }]);

            saveMessageInConversation('user', message);

            // Create a new bot message element for this response
            currentBotMessageElement = createMessageElement('assistant');
            chatMessages.appendChild(currentBotMessageElement);

            fetch('http://localhost:3000/api/ollama/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: state.messages,
                    stream: true,
                    system: state.systemPrompt,
                    temperature: state.temperature
                }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return handleStreamingResponse(response);
                })
                .catch(error => {
                    console.error('Error:', error);
                    updateMessageContent(currentBotMessageElement, `Sorry, there was an error: ${error.message}`, false);
                });
        }
    }

    function handleStreamingResponse(response) {
        return new Promise((resolve, reject) => {
            const reader = response.body.getReader();
            let accumulatedContent = '';

            function read() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        setMessages([...state.messages, { role: 'assistant', content: accumulatedContent }]);
                        resolve({ response: accumulatedContent });
                        saveMessageInConversation('assistant', accumulatedContent);
                        return;
                    }

                    const chunk = new TextDecoder("utf-8").decode(value);
                    const lines = chunk.trim().split('\n');

                    lines.forEach(line => {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));
                                if (data.message && data.message.content) {
                                    accumulatedContent += data.message.content;
                                    updateMessageContent(currentBotMessageElement, accumulatedContent, true);
                                }
                            } catch (error) {
                                console.error("Error parsing stream data:", error, line);
                            }
                        }
                    });
                    read();
                }).catch(reject);
            }
            read();
        });
    }

    function saveMessageInConversation(role, content) {
        fetch('http://localhost:3000/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversationId: state.selectedConversationId,
                role,
                content,
            }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Message saved:', data);
            })
            .catch(error => {
                console.error('Error saving message:', error);
            });
    }

    function toggleTheme() {
        if (themeToggleButton.textContent === '🌙') {
            themeToggleButton.textContent = '☀️';
        } else {
            themeToggleButton.textContent = '🌙';
        }
        document.body.classList.toggle('dark-theme');
    }

    function downloadChat() {
        const content = state.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
        fetch('http://localhost:3000/api/ollama/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'chat.md';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Error downloading chat:', error);
            });
    }
}