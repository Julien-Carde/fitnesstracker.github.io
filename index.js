// Get references to the input elements
let ageInput = document.getElementById('age');
let genderInputs = document.querySelectorAll('input[name="option"]');
let heightInput = document.getElementById('height');
let weightInput = document.getElementById('weight');
let activityLevelInput = document.getElementById('activityLevel'); // Activity level input
let resultBox = document.getElementById('resultBox');

// Function to calculate daily calorie requirements
function dailyCalorieRequirements() {
    // Get updated values inside the function
    let ageValue = ageInput.value;
    let genderValue = document.querySelector('input[name="option"]:checked');
    let heightValue = heightInput.value;
    let weightValue = weightInput.value;
    let activityLevelValue = activityLevelInput.value; // Get the selected activity level multiplier
    let calorieValue;

    // Check if all fields are filled
    if (!ageValue || !genderValue || !heightValue || !weightValue || !activityLevelValue) {
        // If any of the values are missing, clear the result box
        resultBox.innerHTML = '';
        return; // Exit the function without calculating
    }

    // Convert genderValue to string for comparison
    genderValue = genderValue.value;

    // Calculate BMR based on gender
    if (genderValue === 'Female') {
        calorieValue = 447.593 + (9.247 * weightValue) + (3.098 * heightValue) - (4.33 * ageValue);
    } else {
        calorieValue = 88.362 + (13.397 * weightValue) + (4.799 * heightValue) - (5.677 * ageValue);
    }

    // Multiply BMR by the activity level to get TDEE
    calorieValue = calorieValue * activityLevelValue;
    calorieValue = calorieValue.toFixed(2);

    if (calorieValue <= 0) {
        resultBox.innerHTML = ''; // Clear the result box if negative or zero
        return; // Exit the function without displaying the result
    }

    // Display the result in the result box
    resultBox.innerHTML = `<span class="calorie-value">${calorieValue}</span>` + ' kcal';
}

// Add event listeners to update the result whenever inputs change
ageInput.addEventListener('input', dailyCalorieRequirements);
heightInput.addEventListener('input', dailyCalorieRequirements);
weightInput.addEventListener('input', dailyCalorieRequirements);

// Add event listener to all gender radio buttons
genderInputs.forEach(function(genderInput) {
    genderInput.addEventListener('change', dailyCalorieRequirements);
});

// Add event listener to the activity level dropdown
activityLevelInput.addEventListener('change', dailyCalorieRequirements);

// Set the default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    document.getElementById('weightLogDate').value = today;
}

// Event listener for 'Enter' key to trigger logWeight
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        logWeight();
    }
}

// Add event listeners to the input fields
document.getElementById('weightInput').addEventListener('keypress', handleEnterKey);
document.getElementById('weightLogDate').addEventListener('keypress', handleEnterKey);


// Call the function when the page loads
window.onload = setDefaultDate;

// Array to store weight data and corresponding dates
let weightData = [];
let weightDates = [];

// Function to log the weight and date
function logWeight() {
    const weight = document.getElementById('weightInput').value;
    const date = document.getElementById('weightLogDate').value;

    if (weight && date) {
        // Check if an entry already exists for this date
        const dateIndex = weightDates.indexOf(date);

        if (dateIndex === -1) {
            // If the date is not found, add the new weight and date
            weightData.push(parseFloat(weight));
            weightDates.push(date);
        } else {
            // If the date already exists, update the weight for that date
            weightData[dateIndex] = parseFloat(weight);
            alert('Weight for this date has been updated.');
        }

        // Update the chart with the new data
        updateChart();
    } else {
        alert('Please enter both weight and date');
    }
}


function updateChart() {
    const ctx = document.getElementById('weightChart').getContext('2d');
    
    // Check if chart already exists and destroy it to prevent duplication
    if (window.weightChartInstance) {
        window.weightChartInstance.destroy();
    }

    // Create a new chart instance
    window.weightChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weightDates, // Dates as the X-axis
            datasets: [{
                label: 'Weight (kg)',
                data: weightData, // Weight values as the Y-axis
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false // Remove the legend (gray box)
                },
                title: {
                    display: false // Remove the main title
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Weight (kg)'
                    },
                    beginAtZero: false, // Do not force the axis to begin at 0
                    ticks: {
                        callback: function(value) {
                            return value + ' kg'; // Add "kg" to each tick value
                        }
                    },
                    suggestedMin: Math.min(...weightData) - 2, // Set min value 2 units below the minimum weight
                    suggestedMax: Math.max(...weightData) + 2 // Set max value 2 units above the maximum weight
                }
            }
        }
    });
}

let totalCalories = 0;
let foodLog = [];
let timeoutId = null;

// Function to fetch food suggestions as user types
function fetchSuggestions() {
    const foodInput = document.getElementById('foodInput');
    const query = foodInput.value;

    if (query.length < 2) {
        clearSuggestions();
        return;
    }

    // Delay the API call to avoid unnecessary requests on every keystroke
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&json=true`)
            .then(response => response.json())
            .then(data => {
                if (data.products) {
                    displaySuggestions(data.products);
                }
            })
            .catch(error => console.error('Error:', error));
    }, 300); // 300ms delay before sending the request
}

// Function to display food suggestions
function displaySuggestions(products) {
    const autocompleteList = document.getElementById('autocompleteList');
    clearSuggestions(); // Clear previous suggestions

    products.forEach(product => {
        const suggestionItem = document.createElement('div');
        suggestionItem.innerText = product.product_name || 'Unknown';
        suggestionItem.addEventListener('click', () => {
            document.getElementById('foodInput').value = product.product_name; // Set input to the selected product
            clearSuggestions(); // Clear suggestions after selection
            searchFood(); // Trigger search for the selected product
        });
        autocompleteList.appendChild(suggestionItem);
    });
}

// Function to clear suggestions
function clearSuggestions() {
    const autocompleteList = document.getElementById('autocompleteList');
    autocompleteList.innerHTML = ''; // Clear the suggestion list
}

// Function to search for food using Open Food Facts API
function searchFood() {
    const foodName = document.getElementById('foodInput').value;

    fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${foodName}&json=true`)
        .then(response => response.json())
        .then(data => {
            if (data.products && data.products.length > 0) {
                const product = data.products[0]; // Take the first result
                displayFood(product);
            } else {
                document.getElementById('foodResult').innerHTML = 'No results found.';
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Function to display the food result
function displayFood(product) {
    const foodResultDiv = document.getElementById('foodResult');
    const productName = product.product_name || 'Unknown';
    const calories = product.nutriments['energy-kcal'] || 0;
    const proteins = product.nutriments.proteins || 0;
    const fats = product.nutriments.fat || 0;
    const carbs = product.nutriments.carbohydrates || 0;

    // Display food details
    foodResultDiv.innerHTML = `
        <h3>${productName}</h3>
        <p>Calories: ${calories} kcal</p>
        <p>Proteins: ${proteins} g</p>
        <p>Fats: ${fats} g</p>
        <p>Carbs: ${carbs} g</p>
        <button onclick="logFood('${productName}', ${calories})">Log this food</button>
    `;
}

// Function to log the food
function logFood(name, calories) {
    const foodId = Date.now(); // Unique ID for each logged food
    foodLog.push({ id: foodId, name, calories });
    totalCalories += calories;

    updateFoodLogDisplay();
}

// Function to remove food from the log
function removeFood(foodId) {
    const foodIndex = foodLog.findIndex(item => item.id === foodId);
    if (foodIndex !== -1) {
        totalCalories -= foodLog[foodIndex].calories;
        foodLog.splice(foodIndex, 1);
    }

    updateFoodLogDisplay();
}

// Function to update the food log display
function updateFoodLogDisplay() {
    const foodLogDiv = document.getElementById('foodLog');
    let logHtml = '<h3>Food Log:</h3>';
    foodLog.forEach(item => {
        logHtml += `
            <p>
                ${item.name}: ${item.calories} kcal 
                <button onclick="removeFood(${item.id})" style="background: none; border: none;">
                    <img src="https://www.svgrepo.com/show/39876/cancel.svg" alt="Remove" style="width: 16px; height: 16px;">
                </button>
            </p>
        `;
    });
    foodLogDiv.innerHTML = logHtml;

    document.getElementById('totalCalories').innerHTML = `<h3>Total Calories: ${totalCalories} kcal</h3>`;
}

// Add event listener to search button
document.getElementById('searchButton').addEventListener('click', searchFood);

// Clear suggestions if user clicks outside of the autocomplete list
document.addEventListener('click', function(e) {
    if (!e.target.closest('#foodInput') && !e.target.closest('#autocompleteList')) {
        clearSuggestions();
    }
});

function logExercise() {
    // Get the selected exercise
    const exerciseSelect = document.getElementById('exercise');
    const exercise = exerciseSelect.options[exerciseSelect.selectedIndex].text;

    // Get the input values for sets, reps, and weight
    const sets = document.getElementById('set').value.trim();
    const reps = document.getElementById('rep').value.trim();
    const weight = document.getElementById('weight').value.trim();

    // Check if the inputs are valid (not empty and greater than 0)
    
   /**if (sets === "" || reps === "" || weight === "" || sets <= 0 || reps <= 0 || weight <= 0) {
        alert("Please enter valid values for all fields!");
        return;
    }*/

    // Create a new log entry
    const workoutLogEntry = document.createElement('div');
    workoutLogEntry.classList.add('log-entry');
    workoutLogEntry.innerHTML = `<strong>${exercise}</strong>: ${sets} sets of ${reps} reps at ${weight} kg`;

    // Append the new log entry to the workout log
    const workoutLog = document.getElementById('workoutLog');
    workoutLog.appendChild(workoutLogEntry);

    // Clear the input fields after logging
    document.getElementById('set').value = '';
    document.getElementById('rep').value = '';
    document.getElementById('weight').value = '';
}