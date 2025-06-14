document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const username = document.getElementById('loginName').value;
  const password = document.getElementById('loginPassword').value;
  const errorMsg = document.getElementById('login-error');

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),  // changed here
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', data.username);
      errorMsg.style.display = 'none';
      window.location.href = 'index.html';
    } else {
      errorMsg.textContent = data.error || 'Login failed';
      errorMsg.style.display = 'block';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMsg.textContent = 'Server error. Try again later.';
    errorMsg.style.display = 'block';
  }
});
