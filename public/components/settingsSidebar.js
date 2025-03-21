import { state, setSystemPrompt, setTemperature } from '../state.js';

export function initializeSettingsSidebar() {
    const sidebarToggleButton = document.getElementById('sidebarToggleButton');
    const sidebar = document.getElementById('sidebar');

    const temperature = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperatureValue');
    const systemPrompt = document.getElementById('systemPrompt');

    sidebarToggleButton.addEventListener('click', toggleSidebar);
    temperature.addEventListener('input', () => {
        temperatureValue.textContent = temperature.value;
        setTemperature(parseFloat(temperature.value));
    });

    systemPrompt.addEventListener('input', () => {
        setSystemPrompt(systemPrompt.value);
    });

    function toggleSidebar() {
        sidebar.classList.toggle('open');
    }
}