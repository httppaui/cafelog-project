// auth.js — handles login, signup, logout, and GitHub OAuth

async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password,
  });
  if (error) throw error;
  return data;
}

async function signInWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.origin },
  });
  if (error) {
    showToast('Could not connect to GitHub. Please try again.');
    console.error(error);
  }
}

async function signOut() {
  clearInactivityTimer();
  const { error } = await supabase.auth.signOut();
  if (error) console.error(error);
  showAuthScreen();
}

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function showAuthScreen() {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('appWrapper').style.display = 'none';
}

function showAppScreen() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appWrapper').style.display = 'flex';
  resetInactivityTimer();
}

async function initAuth() {
  const user = await getCurrentUser();
  if (user) { showAppScreen(); return user; }
  else       { showAuthScreen(); return null; }
}

function validatePassword(password) {
  const errors = [];
  if (password.length < 8)             errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password))         errors.push('One uppercase letter');
  if (!/[0-9]/.test(password))         errors.push('One number');
  if (!/[^A-Za-z0-9]/.test(password))  errors.push('One special character');
  return errors;
}

function generateCSRFToken() {
  const token = crypto.randomUUID();
  sessionStorage.setItem('csrfToken', token);
  return token;
}

function validateCSRFToken(token) {
  return token === sessionStorage.getItem('csrfToken');
}

function attachCSRFTokens() {
  document.querySelectorAll('#loginForm, #signupForm').forEach((form) => {
    form.querySelector('[name="csrf_token"]')?.remove();
    const token = generateCSRFToken();
    const input = document.createElement('input');
    input.type  = 'hidden';
    input.name  = 'csrf_token';
    input.value = token;
    form.appendChild(input);
  });
}

let inactivityTimer;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(async () => {
    await signOut();
    showToast('Signed out due to inactivity.');
  }, 30 * 60 * 1000);
}

function clearInactivityTimer() {
  clearTimeout(inactivityTimer);
}

function initInactivityTracking() {
  ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'].forEach((event) => {
    document.addEventListener(event, resetInactivityTimer, { passive: true });
  });
}

function initAuthListeners() {
  attachCSRFTokens();

  document.getElementById('showSignup')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginBox').style.display  = 'none';
    document.getElementById('signupBox').style.display = 'block';
    attachCSRFTokens();
  });

  document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupBox').style.display = 'none';
    document.getElementById('loginBox').style.display  = 'block';
    attachCSRFTokens();
  });

  document.getElementById('githubLoginBtn')
    ?.addEventListener('click', signInWithGitHub);
  document.getElementById('githubSignupBtn')
    ?.addEventListener('click', signInWithGitHub);

  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const csrfInput = e.target.querySelector('[name="csrf_token"]');
    if (!validateCSRFToken(csrfInput?.value)) {
      document.getElementById('loginError').textContent =
        'Security validation failed. Please refresh the page.';
      return;
    }
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl  = document.getElementById('loginError');
    const btn      = e.target.querySelector('button[type="submit"]');
    errorEl.textContent = '';
    try {
      btn.disabled = true;
      btn.textContent = 'Signing in…';
      await signIn(email, password);
    } catch (err) {
      errorEl.textContent = err.message || 'Invalid email or password.';
      btn.disabled    = false;
      btn.textContent = 'Sign In';
    }
  });

  document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const csrfInput = e.target.querySelector('[name="csrf_token"]');
    if (!validateCSRFToken(csrfInput?.value)) {
      document.getElementById('signupError').textContent =
        'Security validation failed. Please refresh the page.';
      return;
    }
    const email    = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm  = document.getElementById('signupConfirm').value;
    const errorEl  = document.getElementById('signupError');
    const btn      = e.target.querySelector('button[type="submit"]');
    errorEl.textContent = '';
    if (password !== confirm) {
      errorEl.textContent = 'Passwords do not match.';
      return;
    }
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      errorEl.textContent = passwordErrors.join(' · ');
      return;
    }
    try {
      btn.disabled    = true;
      btn.textContent = 'Creating account…';
      await signUp(email, password);
      document.getElementById('signupBox').innerHTML = `
        <div style="text-align:center;padding:40px 20px">
          <div style="font-size:56px;margin-bottom:16px">☕</div>
          <h3 style="font-family:'Playfair Display',serif;font-style:italic;
            color:var(--espresso);font-size:22px;margin-bottom:10px">
            Check your email!
          </h3>
          <p style="color:var(--bark);font-size:14px;line-height:1.7;
            max-width:300px;margin:0 auto">
            We sent a confirmation link to
            <strong>${escapeHtml(email)}</strong>.
            Click it to activate your account, then sign in.
          </p>
          <a href="#" id="backToLogin" style="display:inline-block;
            margin-top:24px;color:var(--caramel);font-weight:600;font-size:14px">
            ← Back to sign in
          </a>
        </div>`;
      document.getElementById('backToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signupBox').style.display = 'none';
        document.getElementById('loginBox').style.display  = 'block';
      });
    } catch (err) {
      errorEl.textContent = err.message || 'Could not create account.';
      btn.disabled    = false;
      btn.textContent = 'Create Account';
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await signOut();
    showToast('You have been signed out.');
  });

  initInactivityTracking();
}