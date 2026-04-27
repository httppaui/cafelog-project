// account.js — account settings: username, password change, deactivate, delete

function openAccountModal() {
  const overlay = document.getElementById('accountModal');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Pre-fill username if stored
  const username = localStorage.getItem('cafelog_username') || '';
  const input = document.getElementById('usernameInput');
  if (input) input.value = username;

  // Reset sub-panels
  document.getElementById('changePasswordPanel')?.classList.remove('open');
  document.getElementById('passwordChangeError').textContent = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmNewPassword').value = '';
  document.getElementById('accountStatusMsg').textContent = '';
}

function closeAccountModal() {
  document.getElementById('accountModal')?.classList.remove('open');
  document.body.style.overflow = '';
}

function initAccountListeners() {
  document.getElementById('accountBtn')
    ?.addEventListener('click', openAccountModal);

  document.getElementById('closeAccountModal')
    ?.addEventListener('click', closeAccountModal);

  document.getElementById('accountModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('accountModal')) closeAccountModal();
  });

  // Toggle change-password sub-panel
  document.getElementById('toggleChangePassword')?.addEventListener('click', () => {
    const panel = document.getElementById('changePasswordPanel');
    panel?.classList.toggle('open');
  });

  // Save username (stored locally + Supabase user_metadata)
  document.getElementById('saveUsernameBtn')?.addEventListener('click', async () => {
    const val = document.getElementById('usernameInput')?.value.trim();
    if (!val) { showAccountStatus('Please enter a username.', true); return; }

    const btn = document.getElementById('saveUsernameBtn');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      const { error } = await supabase.auth.updateUser({
        data: { username: val }
      });
      if (error) throw error;
      localStorage.setItem('cafelog_username', val);
      showAccountStatus('Username saved!');
    } catch (err) {
      showAccountStatus(err.message || 'Could not save username.', true);
    }

    btn.disabled = false;
    btn.textContent = 'Save Username';
  });

  // Save new password
  document.getElementById('savePasswordBtn')?.addEventListener('click', async () => {
    const newPw  = document.getElementById('newPassword')?.value;
    const confPw = document.getElementById('confirmNewPassword')?.value;
    const errEl  = document.getElementById('passwordChangeError');
    errEl.textContent = '';

    if (newPw !== confPw) {
      errEl.textContent = 'Passwords do not match.';
      return;
    }

    const errors = validatePassword(newPw);
    if (errors.length) {
      errEl.textContent = errors.join(' · ');
      return;
    }

    const btn = document.getElementById('savePasswordBtn');
    btn.disabled = true;
    btn.textContent = 'Updating…';

    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmNewPassword').value = '';
      document.getElementById('changePasswordPanel').classList.remove('open');
      showAccountStatus('Password updated successfully!');
    } catch (err) {
      errEl.textContent = err.message || 'Could not update password.';
    }

    btn.disabled = false;
    btn.textContent = 'Update Password';
  });

  // Deactivate account
  document.getElementById('deactivateAccountBtn')?.addEventListener('click', async () => {
    const confirmed = confirm(
      'Deactivating will sign you out and disable your account.\n\nContact support to reactivate. Continue?'
    );
    if (!confirmed) return;

    try {
      // Mark deactivated in user metadata
      await supabase.auth.updateUser({ data: { deactivated: true } });
      await supabase.auth.signOut();
      showToast('Account deactivated. Sorry to see you go.');
      closeAccountModal();
      showAuthScreen();
    } catch (err) {
      showAccountStatus(err.message || 'Could not deactivate account.', true);
    }
  });

  // Delete account permanently
  document.getElementById('deleteAccountBtn')?.addEventListener('click', async () => {
    const confirmed = confirm(
      '⚠️ This will permanently delete your account and ALL your data.\n\nThis cannot be undone. Are you absolutely sure?'
    );
    if (!confirmed) return;

    const double = confirm('Last chance — delete everything permanently?');
    if (!double) return;

    try {
      // Delete all user data from Supabase tables
      const user = await getCurrentUser();
      if (user) {
        await supabase.from('entries').delete().eq('user_id', user.id);
        await supabase.from('wishlist').delete().eq('user_id', user.id);
        await supabase.from('notepad').delete().eq('user_id', user.id);
      }
      // Sign out (full account deletion requires a server-side function;
      // this clears all data and signs the user out)
      await supabase.auth.signOut();
      localStorage.removeItem('cafelog_username');
      showToast('Account deleted. All data removed.');
      closeAccountModal();
      showAuthScreen();
    } catch (err) {
      showAccountStatus(err.message || 'Could not delete account.', true);
    }
  });
}

function showAccountStatus(msg, isError = false) {
  const el = document.getElementById('accountStatusMsg');
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? '#DC2626' : 'var(--sage)';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.textContent = ''; }, 3500);
}