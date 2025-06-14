document.getElementById('signupForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMsg = document.getElementById('error-msg');

    // Clear previous error messages
    errorMsg.style.display = "none";
    errorMsg.textContent = "";

    // Validate password match
    if (password !== confirmPassword) {
        errorMsg.style.display = "block";
        errorMsg.textContent = "Passwords do not match.";
        return;
    }

    // Validate password length
    if (password.length < 6) {
        errorMsg.style.display = "block";
        errorMsg.textContent = "Password must be at least 6 characters long.";
        return;
    }

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Save login state
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', name);

            // Redirect to homepage
            window.location.href = 'index.html';
        } else {
            errorMsg.style.display = "block";
            errorMsg.textContent = data.error || "Signup failed.";
            
            // If username exists, focus on the username field
            if (data.error && data.error.includes('Username already exists')) {
                document.getElementById('signupName').focus();
            }
        }
    } catch (error) {
        console.error("Signup error:", error);
        errorMsg.style.display = "block";
        errorMsg.textContent = "An error occurred during signup. Please try again.";
    }
});
