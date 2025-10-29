document.addEventListener('DOMContentLoaded', () => {
  const profileForm = document.getElementById('profileForm');
  const savedProfile = localStorage.getItem('bw_profile');
  let profileDisplay = document.getElementById('profileDisplay');

  if (!profileDisplay) {
    profileDisplay = document.createElement('div');
    profileDisplay.id = 'profileDisplay';
    profileDisplay.style.display = 'none';
    profileForm.insertAdjacentElement('beforebegin', profileDisplay);
  }

  // --- Always reset to view mode when the profile section becomes active ---
  const observer = new MutationObserver(() => {
    const profileSection = document.getElementById('profile-section');
    if (profileSection.classList.contains('active')) {
      sessionStorage.setItem('profileMode', 'view');
      refreshProfileView();
    }
  });
  observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

  // --- Initial setup ---
  refreshProfileView();

  // --- Form submission (combined local + database save) ---
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const formData = new FormData(profileForm);
    const data = Object.fromEntries(formData.entries());
    data.dietaryRestrictions = formData.getAll('dietaryRestrictions');

    // 🗄️ Save locally for persistence
    localStorage.setItem('bw_profile', JSON.stringify(data));

    // ☁️ Save to database
    try {
      const res = await fetch('api/saveProfile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      alert(result.success ? 'Profile saved successfully!' : 'Error saving profile.');
    } catch (err) {
      console.error('❌ Network or server error:', err);
      alert('Could not reach the server. Profile saved locally only.');
    }

    // 💫 Switch to view mode
    sessionStorage.setItem('profileMode', 'view');
    showProfileDisplay();
  });

  function refreshProfileView() {
    const savedProfile = localStorage.getItem('bw_profile');
    const mode = sessionStorage.getItem('profileMode') || 'view';
    if (savedProfile && mode === 'view') {
      showProfileDisplay();
    } else if (savedProfile && mode === 'edit') {
      showProfileForm();
    } else {
      showProfileForm();
    }
  }

  function showProfileDisplay() {
    const data = JSON.parse(localStorage.getItem('bw_profile'));
    profileDisplay.innerHTML = `
      <div class="profile-summary">
        <h3>Your Profile</h3>
        <p><strong>Age:</strong> ${data.age || '-'}</p>
        <p><strong>Weight:</strong> ${data.weight || '-'}</p>
        <p><strong>Height:</strong> ${data.height || '-'}</p>
        <p><strong>Gender:</strong> ${data.gender || '-'}</p>
        <p><strong>Activity Level:</strong> ${data.activityLevel || '-'}</p>
        <p><strong>Blood Type:</strong> ${data.bloodType || '-'}</p>
        <p><strong>Allergies:</strong> ${data.allergies || '-'}</p>
        <p><strong>Restrictions:</strong> ${(data.dietaryRestrictions || []).join(', ') || '-'}</p>
        <button id="editProfileBtn" class="btn-secondary">Edit Profile</button>
      </div>
    `;
    profileForm.style.display = 'none';
    profileDisplay.style.display = 'block';
    sessionStorage.setItem('profileMode', 'view');

    document.getElementById('editProfileBtn').addEventListener('click', () => {
      sessionStorage.setItem('profileMode', 'edit');
      showProfileForm();
    });
  }

  function showProfileForm() {
    profileForm.style.display = 'block';
    profileDisplay.style.display = 'none';
    autoFillForm();
  }

  function autoFillForm() {
    const saved = localStorage.getItem('bw_profile');
    if (!saved) return;
    const data = JSON.parse(saved);
    Object.keys(data).forEach(key => {
      const input = profileForm.elements[key];
      if (!input) return;

      if (input.type === 'checkbox') {
        if (Array.isArray(data[key])) {
          for (const val of data[key]) {
            const checkbox = profileForm.querySelector(
              `input[name="${key}"][value="${val}"]`
            );
            if (checkbox) checkbox.checked = true;  
          }
        }
      } else {
        input.value = data[key];
      }
    });
  }
});
