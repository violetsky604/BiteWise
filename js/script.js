// Global state
let currentSection = "dashboard"
let alertsVisible = true
let allAlertsVisible = true

// Recipe data
const recipeData = {
  breakfast: {
    title: "Protein-Packed Overnight Oats",
    description: "Steel-cut oats with Greek yogurt, berries, and almond butter",
    prepTime: "10 minutes",
    cookTime: "0 minutes (overnight)",
    servings: "1",
    difficulty: "Easy",
    ingredients: [
      "1/2 cup steel-cut oats",
      "1/2 cup Greek yogurt (plain)",
      "1/2 cup unsweetened almond milk",
      "1 tbsp almond butter",
      "1/2 cup mixed berries (blueberries, strawberries)",
      "1 tbsp chia seeds",
      "1 tsp honey or maple syrup",
      "1/4 tsp vanilla extract",
      "Pinch of cinnamon",
    ],
    instructions: [
      "In a mason jar or bowl, combine steel-cut oats, chia seeds, and cinnamon.",
      "Add Greek yogurt, almond milk, almond butter, honey, and vanilla extract.",
      "Stir well to combine all ingredients thoroughly.",
      "Add half of the berries and gently fold in.",
      "Cover and refrigerate overnight (at least 4 hours).",
      "In the morning, stir the oats and add remaining berries on top.",
      "Enjoy cold or warm up for 30 seconds in microwave if preferred.",
    ],
    nutrition: {
      calories: "420",
      protein: "25g",
      carbs: "45g",
      fat: "12g",
      fiber: "8g",
      sugar: "18g",
    },
    tips: [
      "Prepare multiple jars at once for easy grab-and-go breakfasts",
      "Try different nut butters like peanut or cashew for variety",
      "Add a scoop of protein powder for extra protein boost",
      "Top with nuts or granola for added crunch",
    ],
  },
  lunch: {
    title: "Mediterranean Quinoa Bowl",
    description: "Quinoa with grilled chicken, vegetables, and tahini dressing",
    prepTime: "15 minutes",
    cookTime: "20 minutes",
    servings: "1",
    difficulty: "Medium",
    ingredients: [
      "1/2 cup quinoa, rinsed",
      "4 oz chicken breast, grilled and sliced",
      "1/2 cucumber, diced",
      "1/2 cup cherry tomatoes, halved",
      "1/4 red onion, thinly sliced",
      "1/4 cup kalamata olives, pitted",
      "2 tbsp feta cheese, crumbled",
      "2 cups mixed greens",
      "2 tbsp tahini",
      "1 tbsp lemon juice",
      "1 clove garlic, minced",
      "1 tsp olive oil",
      "Salt and pepper to taste",
    ],
    instructions: [
      "Cook quinoa according to package directions. Let cool slightly.",
      "Season chicken breast with salt, pepper, and herbs. Grill until cooked through.",
      "Prepare vegetables: dice cucumber, halve tomatoes, slice onion.",
      "Make tahini dressing by whisking together tahini, lemon juice, garlic, and olive oil.",
      "Add water gradually to reach desired consistency.",
      "In a large bowl, combine cooked quinoa with mixed greens.",
      "Top with grilled chicken, vegetables, olives, and feta cheese.",
      "Drizzle with tahini dressing and serve immediately.",
    ],
    nutrition: {
      calories: "520",
      protein: "35g",
      carbs: "48g",
      fat: "18g",
      fiber: "7g",
      sodium: "680mg",
    },
    tips: [
      "Cook quinoa in vegetable broth for extra flavor",
      "Marinate chicken in lemon juice and herbs for 30 minutes before grilling",
      "Make extra tahini dressing - it keeps well in the fridge",
      "Add roasted red peppers for extra Mediterranean flavor",
    ],
  },
  dinner: {
    title: "Baked Salmon with Sweet Potato",
    description: "Herb-crusted salmon with roasted sweet potato and broccoli",
    prepTime: "10 minutes",
    cookTime: "25 minutes",
    servings: "1",
    difficulty: "Easy",
    ingredients: [
      "5 oz salmon fillet",
      "1 medium sweet potato, cubed",
      "1 cup broccoli florets",
      "1 tbsp olive oil",
      "1 tsp dried herbs (dill, parsley, thyme)",
      "1/2 lemon, juiced and zested",
      "2 cloves garlic, minced",
      "Salt and black pepper to taste",
      "1 tsp paprika",
      "Fresh parsley for garnish",
    ],
    instructions: [
      "Preheat oven to 425°F (220°C).",
      "Cube sweet potato and toss with half the olive oil, salt, and pepper.",
      "Place on baking sheet and roast for 15 minutes.",
      "Season salmon with herbs, lemon zest, garlic, salt, and pepper.",
      "Add broccoli to the baking sheet with sweet potatoes.",
      "Place seasoned salmon on the same baking sheet.",
      "Drizzle remaining olive oil over vegetables and salmon.",
      "Bake for 12-15 minutes until salmon flakes easily and vegetables are tender.",
      "Squeeze fresh lemon juice over everything before serving.",
    ],
    nutrition: {
      calories: "480",
      protein: "32g",
      carbs: "35g",
      fat: "22g",
      omega3: "1.8g",
      fiber: "6g",
    },
    tips: [
      "Don't overcook salmon - it should be slightly pink in the center",
      "Cut sweet potatoes evenly for uniform cooking",
      "Add a drizzle of honey to sweet potatoes for caramelization",
      "Serve with a side of quinoa for extra carbs if needed",
    ],
  },
}

// DOM elements
const hamburgerBtn = document.getElementById("hamburgerBtn")
const sidebar = document.getElementById("sidebar")
const navItems = document.querySelectorAll(".nav-item")
const sections = document.querySelectorAll(".section")
const toggleAlertsBtn = document.getElementById("toggleAlertsBtn")
const alertsList = document.getElementById("alertsList")
const toggleAllAlertsBtn = document.getElementById("toggleAllAlertsBtn")
const allAlertsList = document.getElementById("allAlertsList")

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  initializeNavigation()
  initializeAlerts()
  initializeChat()
  initializeModals()
  initializeRecipeButtons()

  // Set initial section
  showSection("dashboard")
})

// Navigation functions
function initializeNavigation() {
  // Hamburger menu toggle
  hamburgerBtn?.addEventListener("click", () => {
    sidebar.classList.toggle("open")
  })

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 1024) {
      if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        sidebar.classList.remove("open")
      }
    }
  })

  // Navigation item clicks
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      const section = this.dataset.section
      if (section) {
        showSection(section)

        // Close mobile menu
        if (window.innerWidth <= 1024) {
          sidebar.classList.remove("open")
        }
      }
    })
  })
}

function showSection(sectionName) {
  currentSection = sectionName

  // Update navigation
  navItems.forEach((item) => {
    item.classList.remove("active")
    if (item.dataset.section === sectionName) {
      item.classList.add("active")
    }
  })

  // Update sections
  sections.forEach((section) => {
    section.classList.remove("active")
    if (section.id === `${sectionName}-section`) {
      section.classList.add("active")
    }
  })
}

// Alerts functions
function initializeAlerts() {
  // Toggle alerts in dashboard
  toggleAlertsBtn?.addEventListener("click", () => {
    alertsVisible = !alertsVisible
    updateAlertsVisibility()
  })

  // Toggle all alerts in alerts section
  toggleAllAlertsBtn?.addEventListener("click", () => {
    allAlertsVisible = !allAlertsVisible
    updateAllAlertsVisibility()
  })

  // View more/less functionality
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("view-more-btn")) {
      toggleAlertDescription(e.target)
    }
  })

  // Dismiss alerts
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("dismiss-btn")) {
      dismissAlert(e.target)
    }
  })

  // Initialize all alerts list
  initializeAllAlertsList()
}

function updateAlertsVisibility() {
  const alertsList = document.getElementById("alertsList")
  const toggleBtn = document.getElementById("toggleAlertsBtn")
  const toggleIcon = toggleBtn.querySelector(".toggle-icon")
  const toggleText = toggleBtn.querySelector("span")

  if (alertsVisible) {
    alertsList.classList.remove("hidden")
    toggleText.textContent = "Close Alerts"
    toggleIcon.innerHTML = `
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        `
  } else {
    alertsList.classList.add("hidden")
    toggleText.textContent = "Show Alerts"
    toggleIcon.innerHTML = `
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        `
  }
}

function updateAllAlertsVisibility() {
  const alertsList = document.getElementById("allAlertsList")
  const toggleBtn = document.getElementById("toggleAllAlertsBtn")
  const toggleIcon = toggleBtn.querySelector(".toggle-icon")
  const toggleText = toggleBtn.querySelector("span")

  if (allAlertsVisible) {
    alertsList.classList.remove("hidden")
    toggleText.textContent = "Close Alerts"
  } else {
    alertsList.classList.add("hidden")
    toggleText.textContent = "Show Alerts"
  }
}

function toggleAlertDescription(button) {
  const alertDescription = button.closest(".alert-description")
  const descriptionText = alertDescription.querySelector(".description-text")
  const fullText = alertDescription.dataset.full

  if (button.textContent === "View more") {
    descriptionText.textContent = fullText
    button.textContent = "View less"
  } else {
    const truncatedText = fullText.substring(0, 60) + "..."
    descriptionText.textContent = truncatedText
    button.textContent = "View more"
  }
}

function dismissAlert(button) {
  const alertItem = button.closest(".alert-item")
  alertItem.style.opacity = "0"
  alertItem.style.transform = "translateX(100%)"

  setTimeout(() => {
    alertItem.remove()
  }, 300)
}

function initializeAllAlertsList() {
  const allAlertsList = document.getElementById("allAlertsList")
  const dashboardAlerts = document.getElementById("alertsList")

  if (allAlertsList && dashboardAlerts) {
    allAlertsList.innerHTML = dashboardAlerts.innerHTML
  }
}

// Chat functions
function initializeChat() {
  const chatInput = document.getElementById("chatInput")
  const sendBtn = document.getElementById("sendMessageBtn")
  const chatMessages = document.getElementById("chatMessages")
  const suggestionBtns = document.querySelectorAll(".suggestion-btn")

  // Send message
  sendBtn?.addEventListener("click", sendMessage)
  chatInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  })

  // Suggestion buttons
  suggestionBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const question = this.dataset.question
      if (chatInput) {
        chatInput.value = question
        sendMessage()
      }
    })
  })

  function sendMessage() {
    const message = chatInput.value.trim()
    if (!message) return

    // Add user message
    addMessage(message, "user")

    // Clear input
    chatInput.value = ""

    // Simulate AI response
    setTimeout(() => {
      const response = generateAIResponse(message)
      addMessage(response, "ai")
    }, 1000)
  }

  function addMessage(text, type) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${type}-message`

    const avatarDiv = document.createElement("div")
    avatarDiv.className = "message-avatar"

    if (type === "ai") {
      avatarDiv.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 17h.01"/>
                </svg>
            `
    } else {
      avatarDiv.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
            `
    }

    const contentDiv = document.createElement("div")
    contentDiv.className = "message-content"
    contentDiv.innerHTML = `<p>${text}</p>`

    messageDiv.appendChild(avatarDiv)
    messageDiv.appendChild(contentDiv)

    chatMessages.appendChild(messageDiv)
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  function generateAIResponse(message) {
    const responses = {
      "suggest a high-protein breakfast":
        "Great question! For a high-protein breakfast, I recommend our Protein-Packed Overnight Oats with 25g of protein. You could also try Greek yogurt with nuts and berries, or scrambled eggs with spinach and cheese. Would you like a specific recipe?",
      "help me adjust my calorie goals":
        "I can help you adjust your calorie goals! Based on your current profile, you're targeting 1,800 calories daily. For weight loss, we could reduce to 1,600-1,700. For muscle gain, we might increase to 2,000-2,200. What's your primary goal right now?",
      "what foods are good for muscle gain?":
        "For muscle gain, focus on: 1) Lean proteins like chicken, fish, eggs, and Greek yogurt, 2) Complex carbs like quinoa, sweet potatoes, and oats, 3) Healthy fats from nuts, avocado, and olive oil. Aim for 1.6-2.2g protein per kg of body weight daily!",
      "quick 15-minute meal ideas":
        "Here are some quick 15-minute meals: 1) Greek yogurt parfait with berries and granola, 2) Avocado toast with scrambled eggs, 3) Protein smoothie with banana and spinach, 4) Tuna salad wrap, 5) Stir-fried vegetables with tofu. Which sounds good to you?",
    }

    const lowerMessage = message.toLowerCase()
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key.toLowerCase())) {
        return response
      }
    }

    return "That's a great question! Based on your profile and goals, I'd recommend focusing on balanced nutrition with adequate protein, complex carbohydrates, and healthy fats. Would you like me to suggest some specific meal ideas or help you with a particular aspect of your nutrition plan?"
  }
}

// 🧹 Removed initializeForms 
// 🧹 Removed goalForm logic (now handled entirely by goals.js)


// Modals functions
function initializeModals() {
  const recipeModal = document.getElementById("recipeModal")
  const goalModal = document.getElementById("goalModal")
  const closeRecipeModal = document.getElementById("closeRecipeModal")
  const closeGoalModal = document.getElementById("closeGoalModal")
  const addGoalBtn = document.getElementById("addGoalBtn")
  const cancelGoal = document.getElementById("cancelGoal")

  // Recipe modal
  closeRecipeModal?.addEventListener("click", () => {
    recipeModal.classList.remove("active")
  })

  // Goal modal
  addGoalBtn?.addEventListener("click", () => {
    goalModal.classList.add("active")
  })

  closeGoalModal?.addEventListener("click", () => {
    goalModal.classList.remove("active")
  })

  cancelGoal?.addEventListener("click", () => {
    goalModal.classList.remove("active")
  })

  // Close modals when clicking overlay
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      e.target.classList.remove("active")
    }
  })
}

// Recipe functions
function initializeRecipeButtons() {
  const viewRecipeBtns = document.querySelectorAll(".view-recipe-btn")

  viewRecipeBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const mealType = this.dataset.meal
      showRecipeModal(mealType)
    })
  })
}

function showRecipeModal(mealType) {
  const modal = document.getElementById("recipeModal")
  const title = document.getElementById("recipeTitle")
  const content = document.getElementById("recipeContent")
  const recipe = recipeData[mealType]

  if (!recipe) return

  title.textContent = recipe.title
  content.innerHTML = generateRecipeHTML(recipe)
  modal.classList.add("active")
}

function generateRecipeHTML(recipe) {
  return `
        <div class="recipe-details">
            <p style="color: #6b7280; margin-bottom: 16px;">${recipe.description}</p>
            
            <div class="recipe-info">
                <div class="recipe-info-item">
                    <div class="label">Prep Time</div>
                    <div class="value">${recipe.prepTime}</div>
                </div>
                <div class="recipe-info-item">
                    <div class="label">Cook Time</div>
                    <div class="value">${recipe.cookTime}</div>
                </div>
                <div class="recipe-info-item">
                    <div class="label">Servings</div>
                    <div class="value">${recipe.servings}</div>
                </div>
                <div class="recipe-info-item">
                    <div class="label">Difficulty</div>
                    <div class="value">${recipe.difficulty}</div>
                </div>
            </div>

            <div class="recipe-section">
                <h3>Ingredients</h3>
                <ul class="ingredients-list">
                    ${recipe.ingredients.map((ingredient) => `<li>${ingredient}</li>`).join("")}
                </ul>
            </div>

            <div class="recipe-section">
                <h3>Instructions</h3>
                <ol class="instructions-list">
                    ${recipe.instructions
                      .map(
                        (instruction, index) => `
                        <li>
                            <div class="step-number">${index + 1}</div>
                            <div class="step-text">${instruction}</div>
                        </li>
                    `,
                      )
                      .join("")}
                </ol>
            </div>

            <div class="recipe-section">
                <h3>Nutrition Information</h3>
                <div class="nutrition-grid">
                    ${Object.entries(recipe.nutrition)
                      .map(
                        ([key, value]) => `
                        <div class="nutrition-item">
                            <div class="amount">${value}</div>
                            <div class="nutrient">${key.charAt(0).toUpperCase() + key.slice(1)}</div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>

            <div class="recipe-section">
                <h3>Chef's Tips</h3>
                <ul class="tips-list">
                    ${recipe.tips.map((tip) => `<li>${tip}</li>`).join("")}
                </ul>
            </div>
        </div>
    `
}

// Additional functionality
document.getElementById("regeneratePlanBtn")?.addEventListener("click", function () {
  // Simulate regenerating meal plan
  this.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
        </svg>
        Regenerating...
    `

  setTimeout(() => {
    this.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
            </svg>
            Regenerate Plan
        `
    alert("New meal plan generated!")
  }, 2000)
})

// Handle window resize
window.addEventListener("resize", () => {
  if (window.innerWidth > 1024) {
    sidebar.classList.remove("open")
  }
})
