document.addEventListener('DOMContentLoaded', () => {
  const profileForm = document.getElementById('profileForm');
  if (!profileForm) return;

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Gather all form data
    const data = Object.fromEntries(new FormData(profileForm).entries());

    // Save to localStorage (temporary front-end persistence)
    localStorage.setItem('bw_profile', JSON.stringify(data));

    alert('Profile saved successfully!');
  });

  // Optional: auto-fill if data already exists
  const saved = localStorage.getItem('bw_profile');
  if (saved) {
    const data = JSON.parse(saved);
    Object.keys(data).forEach(key => {
      const input = profileForm.elements[key];
      if (input) input.value = data[key];
    });
  }
});
