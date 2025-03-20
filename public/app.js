document.addEventListener('DOMContentLoaded', () => {
    const modelSelector = document.getElementById('modelSelector');
    const modelSummary = document.getElementById('modelSummary');
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const themeToggleButton = document.getElementById('themeToggleButton');
    const sidebarToggleButton = document.getElementById('sidebarToggleButton');
    const sidebar = document.getElementById('sidebar');
    const systemPrompt = document.getElementById('systemPrompt');
    const temperature = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperatureValue');
    const conversationList = document.getElementById('conversationList');
    const newConversationButton = document.getElementById('newConversationButton');
    const conversationSidebarToggleButton = document.getElementById('conversationSidebarToggleButton');
    const conversationSidebar = document.getElementById('conversationSidebar');
    
    let messages = []
    let selectedModel = '';
    let currentBotMessageElement = null;
    let selectedConversationId = null;

    // EVENT LISTENERS
    themeToggleButton.addEventListener('click', toggleTheme);
    sidebarToggleButton.addEventListener('click', toggleSidebar);
    conversationSidebarToggleButton.addEventListener('click', toggleConversationSidebar);
    temperature.addEventListener('input', () => {
        temperatureValue.textContent = temperature.value;
    });
    // model selector
    modelSelector.addEventListener('change', (e) => {
        selectedModel = e.target.value;
        fetchModel(selectedModel);
    });
    // send btn
    sendButton.addEventListener('click', sendMessage);
    // input
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    // copy buttons
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
    newConversationButton.addEventListener('click', addConversation);
    conversationList.addEventListener('click', (e) => {
        if (e.target.classList.contains('conversation-item')) {
            selectedConversationId = e.target.dataset.id;
            fetchMessages(selectedConversationId);
        }
    });

    // Fetch available models
    fetchModels();

    // Fetch conversations and set defaults
    fetchConversations();

    function setDefaults() {
        systemPrompt.value = 'You are a helpful assistant called MAX.';
        temperature.value = 0.7;
        messages = [
            { role: 'system', content: '' },
        ];
        chatMessages.innerHTML = '';
    }

    function fetchModel(selectedModel) {
        fetch('http://localhost:3000/api/model?name=' + selectedModel)
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
        fetch('http://localhost:3000/api/models')
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

    function fetchConversations() {
        fetch('http://localhost:3000/api/conversations')
            .then(response => response.json())
            .then(data => {
                conversationList.innerHTML = '';

                setDefaults();

                data.forEach(conversation => {
                    const item = document.createElement('div');
                    item.classList.add('conversation-item');
                    item.dataset.id = conversation.id;
                    item.textContent = conversation.title;

                    // Add edit and delete buttons
                    const div = document.createElement('div');
                    const editButton = document.createElement('button');
                    editButton.textContent = 'Edit';
                    editButton.classList.add('edit-button');
                    editButton.addEventListener('click', () => editConversation(conversation.id));

                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.classList.add('delete-button');
                    deleteButton.addEventListener('click', () => deleteConversation(conversation.id));

                    div.appendChild(editButton);
                    div.appendChild(deleteButton);
                    item.appendChild(div);

                    item.addEventListener('click', () => selectConversation(conversation.id));

                    conversationList.appendChild(item);
                });
            })
            .catch(error => {
                console.error('Error fetching conversations:', error);
            });
    }

    function selectConversation(conversationId) {
        selectedConversationId = conversationId;
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('selected');
        });
        const selectedItem = document.querySelector(`.conversation-item[data-id="${conversationId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }

    function addConversation() {
        const title = prompt('Enter conversation title:');
        if (title) {
            fetch('http://localhost:3000/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title }),
            })
                .then(response => response.json())
                .then(({id:number}) => {
                    selectedConversationId = number;
                    fetchConversations();
                })
                .catch(error => {
                    console.error('Error adding conversation:', error);
                });
        }
    }

    function editConversation(conversationId) {
        const title = prompt('Enter new conversation title:');
        if (title) {
            fetch(`http://localhost:3000/api/conversations/${conversationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title }),
            })
                .then(response => response.json())
                .then(data => {
                    fetchConversations();
                })
                .catch(error => {
                    console.error('Error editing conversation:', error);
                });
        }
    }

    function deleteConversation(conversationId) {
        if (confirm('Are you sure you want to delete this conversation?')) {
            fetch(`http://localhost:3000/api/conversations/${conversationId.toString()}`, {
                method: 'DELETE',
            })
                .then(response => response.json())
                .then(data => {
                    fetchConversations();
                })
                .catch(error => {
                    console.error('Error deleting conversation:', error);
                });
        }
    }

    function fetchMessages(conversationId) {
        fetch(`http://localhost:3000/api/messages?conversationId=${conversationId}`)
            .then(response => response.json())
            .then(data => {
                chatMessages.innerHTML = '';
                data.forEach(message => {
                    addMessageToChat(message.role, message.content, true);
                });
            })
            .catch(error => {
                console.error('Error fetching messages:', error);
            });
    }

    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addMessageToChat('user', message, true);
            userInput.value = '';

            messages = [...messages, { role: 'user', content: message }];

            saveMessageInConversation('user', message)

            // Create a new bot message element for this response
            currentBotMessageElement = createMessageElement('assistant');
            chatMessages.appendChild(currentBotMessageElement);

            fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages,
                    stream: true,
                    system: systemPrompt.value,
                    temperature: parseFloat(temperature.value)
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

    function saveMessageInConversation(role, content) {
        // Save message to the current conversation
        if (selectedConversationId) {
            fetch('http://localhost:3000/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationId: selectedConversationId,
                    role,
                    content
                }),
            })
                .catch(error => {
                    console.error('Error saving message:', error);
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
                        messages = [...messages, { role: 'assistant', content: accumulatedContent }];
                        resolve({ response: accumulatedContent });
                        saveMessageInConversation('assistant', accumulatedContent)
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

    function createMessageElement(role) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${role}-message`);
        return messageElement;
    }

    function updateMessageContent(messageElement, content, format = true) {
        if (format) {
            const formattedContent = formatMessage(content);
            messageElement.innerHTML = formattedContent;
        } else {
            messageElement.textContent = DOMPurify.sanitize(content);
        }

        // Append the message element to the chat messages container
        chatMessages.appendChild(messageElement);

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

        // Use marked for the rest of the content
        formattedContent = DOMPurify.sanitize(marked.parse(formattedContent));

        return formattedContent;
    }

    function addMessageToChat(role, content, format = true) {
        const messageElement = createMessageElement(role);
        updateMessageContent(messageElement, content, format);
    }

    function toggleTheme() {
        if (themeToggleButton.textContent === '🌙') {
            themeToggleButton.textContent = '☀️';
        } else {
            themeToggleButton.textContent = '🌙';
        }
        document.body.classList.toggle('dark-theme');
    }

    function toggleSidebar() {
        sidebar.classList.toggle('open');
    }

    function toggleConversationSidebar() {
        conversationSidebar.classList.toggle('open');
    }

    hljs.highlightAll();
});

