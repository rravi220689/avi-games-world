/**
 * Avi Games World - Cosmic AI Help Assistant & Suggestion Relay
 * Interactive cyberpunk chatbot that answers site questions, assists pilots,
 * and saves suggestions directly to the backend database.
 */

class CosmicChatbot {
    constructor() {
        this.launcher = document.getElementById('cosmic-chatbot-launcher');
        this.container = document.getElementById('cosmic-chatbot-container');
        this.closeBtn = document.getElementById('chatbot-close-btn');
        this.messagesEl = document.getElementById('chatbot-messages');
        this.form = document.getElementById('chatbot-form');
        this.input = document.getElementById('chatbot-input');
        this.chips = document.querySelectorAll('.chip-btn');

        if (!this.launcher || !this.container) return;

        this.sessionId = this.getOrCreateSessionId();
        this.isTyping = false;

        this.init();
    }

    getOrCreateSessionId() {
        let sid = localStorage.getItem('avi_cosmic_chat_session');
        if (!sid) {
            sid = 'session_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
            localStorage.setItem('avi_cosmic_chat_session', sid);
        }
        return sid;
    }

    init() {
        // Toggle Open/Close
        this.launcher.addEventListener('click', () => this.toggle());
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        // Form Submit
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                const text = this.input.value.trim();
                if (text && !this.isTyping) {
                    this.sendMessage(text);
                    this.input.value = '';
                }
            });
        }

        // Quick Chips
        this.chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const query = chip.getAttribute('data-query');
                if (query) {
                    if (query.endsWith(' ')) {
                        this.input.value = query;
                        this.input.focus();
                    } else {
                        this.sendMessage(query);
                    }
                }
            });
        });

        // Hide during game play detection
        this.checkGameMode();
    }

    checkGameMode() {
        const path = window.location.pathname;
        const isGameUrl = path.startsWith('/race/') || 
                          path.includes('/arcade/gold-rush/') || 
                          path.includes('/arcade/quantum-puzzle/') || 
                          path.includes('/arcade/void-invaders/');

        if (isGameUrl || document.body.classList.contains('in-game')) {
            document.body.classList.add('in-game');
            this.close();
        }
    }

    toggle() {
        if (this.container.classList.contains('open')) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.container.classList.add('open');
        this.scrollToBottom();
        if (this.input) this.input.focus();
    }

    close() {
        this.container.classList.remove('open');
    }

    formatMarkdown(text) {
        if (!text) return '';
        // Convert **bold**
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Convert `code`
        formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:rgba(0,240,255,0.15); color:#00f0ff; padding:1px 5px; border-radius:3px; font-family:monospace;">$1</code>');
        // Convert bullet points
        formatted = formatted.replace(/\n• /g, '<br>• ');
        formatted = formatted.replace(/\n  - /g, '<br>&nbsp;&nbsp;• ');
        formatted = formatted.replace(/\n\n/g, '<br><br>');
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
    }

    appendUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg user-msg';
        msgDiv.innerHTML = `<div class="msg-bubble">${this.escapeHTML(text)}</div>`;
        this.messagesEl.appendChild(msgDiv);
        this.scrollToBottom();
    }

    appendBotMessage(text, isSuggestion = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg bot-msg';
        
        let extraBadge = '';
        if (isSuggestion) {
            extraBadge = `<div style="margin-top:0.6rem; padding:0.4rem 0.6rem; background:rgba(0,255,136,0.15); border:1px solid #00ff88; border-radius:6px; color:#00ff88; font-size:0.75rem; font-family:var(--font-heading);"><i class="fa-solid fa-database"></i> SAVED IN DATABASE</div>`;
        }

        msgDiv.innerHTML = `<div class="msg-bubble">${this.formatMarkdown(text)}${extraBadge}</div>`;
        this.messagesEl.appendChild(msgDiv);
        this.scrollToBottom();
    }

    showTyping() {
        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.id = 'chatbot-typing';
        typingDiv.className = 'chat-typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        this.messagesEl.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        const typingDiv = document.getElementById('chatbot-typing');
        if (typingDiv) typingDiv.remove();
    }

    scrollToBottom() {
        if (this.messagesEl) {
            this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        }
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    async sendMessage(text) {
        this.appendUserMessage(text);
        this.showTyping();

        const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '';

        try {
            const resp = await fetch('/api/chatbot/message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    message: text,
                    session_id: this.sessionId
                })
            });

            const data = await resp.json();
            this.hideTyping();

            if (data.success) {
                this.appendBotMessage(data.reply, data.suggestion_saved);
            } else {
                this.appendBotMessage("⚠️ Apologies pilot, my cosmic telemetry encountered an error. Please try again or visit `/contact/`.");
            }
        } catch (err) {
            this.hideTyping();
            this.appendBotMessage("📡 Communication signal jammed. Please check your connection or send a direct transmission via the Contact page.");
        }
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    window.cosmicBot = new CosmicChatbot();
});
