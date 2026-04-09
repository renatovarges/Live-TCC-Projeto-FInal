(function() {
    const CORRECT_PIN = '1979';
    const STORAGE_KEY = 'tcc_authorized';
    
    let currentInput = '';
    
    // Check if authorized
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
        document.addEventListener('DOMContentLoaded', () => {
            const overlay = document.getElementById('pin-overlay');
            if (overlay) overlay.remove();
        });
        return;
    }

    // Initialize Auth Overlay
    function init() {
        const overlay = document.getElementById('pin-overlay');
        const displayDots = document.querySelectorAll('.pin-dot');
        const keys = document.querySelectorAll('.pin-key');
        const message = document.getElementById('pin-message');
        const container = document.querySelector('.pin-container');

        keys.forEach(key => {
            key.addEventListener('click', () => {
                const value = key.getAttribute('data-value');
                
                if (value === 'delete') {
                    currentInput = currentInput.slice(0, -1);
                } else if (currentInput.length < 4) {
                    currentInput += value;
                }

                updateDisplay();

                if (currentInput.length === 4) {
                    validate();
                }
            });
        });

        function updateDisplay() {
            displayDots.forEach((dot, index) => {
                if (index < currentInput.length) {
                    dot.classList.add('filled');
                } else {
                    dot.classList.remove('filled');
                }
            });
            message.classList.remove('visible');
        }

        function validate() {
            if (currentInput === CORRECT_PIN) {
                localStorage.setItem(STORAGE_KEY, 'true');
                overlay.classList.add('hidden');
                setTimeout(() => overlay.remove(), 500);
            } else {
                // Wrong PIN
                container.classList.add('shake');
                message.textContent = 'PIN INCORRETO. TENTE NOVAMENTE.';
                message.classList.add('visible');
                
                setTimeout(() => {
                    container.classList.remove('shake');
                    currentInput = '';
                    updateDisplay();
                }, 600);
            }
        }
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (overlay.classList.contains('hidden')) return;
            
            if (e.key >= '0' && e.key <= '9') {
                if (currentInput.length < 4) {
                    currentInput += e.key;
                    updateDisplay();
                    if (currentInput.length === 4) validate();
                }
            } else if (e.key === 'Backspace') {
                currentInput = currentInput.slice(0, -1);
                updateDisplay();
            }
        });
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
