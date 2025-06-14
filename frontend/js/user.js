// User-related functionality
function updateUserInterface() {
    const username = localStorage.getItem('username');
    const userMenuContainer = document.getElementById('userMenuContainer');
    
    if (username) {
        // Update welcome message
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome back, ${username}!`;
        }

        // Create user menu if it doesn't exist
        if (userMenuContainer && !userMenuContainer.querySelector('.user-menu')) {
            const userMenu = document.createElement('div');
            userMenu.className = 'user-menu';
            userMenu.innerHTML = `
                <div class="user-menu-button">
                    <span>${username}</span>
                    <div class="user-dropdown">
                        <a href="profile.html">Profile</a>
                        <a href="settings.html">Settings</a>
                        <a href="#" id="logoutButton">Logout</a>
                    </div>
                </div>
            `;
            userMenuContainer.appendChild(userMenu);

            // Add logout functionality
            document.getElementById('logoutButton').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('username');
                window.location.href = 'login.html';
            });
        }
    } else {
        // Clear user menu if user is not logged in
        if (userMenuContainer) {
            userMenuContainer.innerHTML = '';
        }
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', updateUserInterface); 