const loginCard = document.getElementById('login-form-card');
const signupCard = document.getElementById('signup-form-card');
const toSignupBtn = document.getElementById('to-signup-btn');
const toLoginBtn = document.getElementById('to-login-btn');

toSignupBtn.addEventListener('click', () => {
    loginCard.style.display = 'none';
    signupCard.style.display = 'block';
});

toLoginBtn.addEventListener('click', () => {
    signupCard.style.display = 'none';
    loginCard.style.display = 'block';
});

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('mode') === 'signup') {
    loginCard.style.display = 'none';
    signupCard.style.display = 'block';
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/pages/account.html';
    } else {
        alert(data.error);
    }
}

async function handleSignup() {
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();
    if (response.ok) {
        alert('Account created! Turning you over to log in panel.');
        signupCard.style.display = 'none';
        loginCard.style.display = 'block';
    } else {
        alert(data.error);
    }
}