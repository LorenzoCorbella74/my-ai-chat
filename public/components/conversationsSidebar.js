import { state, setMessages, setSelectedConversationId, setSystemPrompt, setTemperature } from '../state.js';
import { addMessageToChat } from '../utils.js';

export function initializeConversationsSidebar() {
    const conversationList = document.getElementById('conversationList');
    const newConversationButton = document.getElementById('newConversationButton');
    const conversationSidebarToggleButton = document.getElementById('conversationSidebarToggleButton');
    const conversationSidebar = document.getElementById('conversationSidebar');
    const mainPage = document.querySelector('main');

    newConversationButton.addEventListener('click', addConversation);
    conversationSidebarToggleButton.addEventListener('click', toggleConversationSidebar);
    conversationList.addEventListener('click', (e) => {
        if (e.target.classList.contains('conversation-item')) {
            setSelectedConversationId(e.target.dataset.id);
            fetchMessages(state.selectedConversationId);
        }
    });

    fetchConversations();

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
        setSelectedConversationId(conversationId);
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
                .then(({ id: number }) => {
                    setSelectedConversationId(number);
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
                    setSelectedConversationId(null);
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
                state.chatMessages.innerHTML = '';
                data.forEach(message => {
                    addMessageToChat(message.role, message.content, true);
                });
            })
            .catch(error => {
                console.error('Error fetching messages:', error);
            });
    }

    function setDefaults() {
        setSystemPrompt('You are a helpful assistant called MAX.');
        setTemperature(0.7);
        setMessages([
            { role: 'system', content: '' },
        ]);
        state.chatMessages.innerHTML = '';
    }

    function toggleConversationSidebar() {
        conversationSidebar.classList.toggle('open');
        mainPage.classList.toggle('shifted');
    }
}