document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ goals.js loaded and running");

  const goalForm = document.getElementById("goalForm");
  const modal = document.getElementById("goalModal");
  const addGoalBtn = document.getElementById("addGoalBtn");
  const closeModal = document.getElementById("closeGoalModal");
  const cancelGoal = document.getElementById("cancelGoal");
  const goalsGrid = document.querySelector("#goals-section .goals-grid");

  function renderGoals() {
    const stored = JSON.parse(localStorage.getItem("bw_goals") || "[]");
    console.log("📦 Stored goals:", stored);

    if (!goalsGrid) {
      console.error("❌ goalsGrid not found in DOM");
      return;
    }

    if (stored.length === 0) {
      goalsGrid.innerHTML = `<p class="empty-text">No goals yet. Click “Add New Goal” to get started!</p>`;
      return;
    }

    goalsGrid.innerHTML = stored
      .map(
        (g) => `
        <div class="goal-card">
          <div class="goal-header">
            <h3>${g.goalTitle || "(Untitled)"}</h3>
            <span class="goal-status active">Active</span>
          </div>
          <div class="goal-content">
            <p>${g.goalDescription || "(No description)"}</p>
            <div class="goal-stats">
              <span>Target: ${g.goalTarget || "—"}</span>
              <span>Deadline: ${g.goalDeadline || "—"}</span>
            </div>
          </div>
        </div>`
      )
      .join("");
  }

  function closeGoalModal() {
    modal.classList.remove("active");
  }

  addGoalBtn?.addEventListener("click", () => modal.classList.add("active"));
  closeModal?.addEventListener("click", closeGoalModal);
  cancelGoal?.addEventListener("click", closeGoalModal);

  goalForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      goalType: document.getElementById("goalType").value.trim(),
      goalTitle: document.getElementById("goalTitle").value.trim(),
      goalDescription: document.getElementById("goalDescription").value.trim(),
      goalTarget: document.getElementById("goalTarget").value.trim(),
      goalDeadline: document.getElementById("goalDeadline").value.trim(),
    };

    console.log("🎯 Captured goal data:", data);

    // 🗄️ Save locally for offline persistence
    const goals = JSON.parse(localStorage.getItem("bw_goals") || "[]");
    goals.push(data);
    localStorage.setItem("bw_goals", JSON.stringify(goals));
    console.log("✅ Saved locally:", localStorage.getItem("bw_goals"));

    // ☁️ Save to database
    try {
      const res = await fetch("api/saveGoal.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      alert(result.success ? "Goal saved successfully!" : "Error saving goal.");
    } catch (err) {
      console.error("❌ Network or server error:", err);
      alert("Could not reach the server. Saved locally only.");
    }

    // 🧹 Reset + close modal
    goalForm.reset();
    modal.classList.remove("active");
    renderGoals();
  });

  renderGoals();
});
