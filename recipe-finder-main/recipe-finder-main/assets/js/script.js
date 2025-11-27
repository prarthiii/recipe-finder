/* === RECIPE FINDER JS — Fixed Favorites Toggle & Copy Link === */

var searchBtn = document.getElementById('searchBtn');
var spoonacularAPIKey = "0d9ec777d83f403b8ae14136bf45e4e4";
var youtubeAPIKey = "AIzaSyB7n9rKXwh5RoIn3mnR9i-auGoOMy9NOIU";

var recipeSearchResultsEl = document.getElementById('search-results');
var recipeHistoryContainerEl = document.getElementById('recipe-history-container');
var recipeHistoryListEl = document.getElementById('recipe-history-list');
var clearBtn = document.getElementById('clearBtn');
var youtubeVideoEl = document.getElementById("youtube-video");
var recipeTitleEl = document.getElementById("recipe-title");
var selectedIngredientsEl = document.getElementById("selected-ingredients");
var rightWrapContainer = document.getElementById('right-wrap');
var modal = document.getElementById("myModal");
var span = document.getElementsByClassName("close")[0];

var selectedRecipe;
var selectedRecipeID;
var recipeURL;

// --- Modal close
span.onclick = function () { modal.style.display = "none"; }
window.onclick = function (event) { if (event.target == modal) modal.style.display = "none"; }

// --- On load: show history & favorites
window.onload = function () {
    showRecipeHistory();
    showFavorites();
    rightWrapContainer.style.display = "none";
    if (recipeSearchResultsEl) {
        recipeSearchResultsEl.style.display = "flex";
        recipeSearchResultsEl.style.flexWrap = "wrap";
        recipeSearchResultsEl.style.justifyContent = "center";
    }
}

// --- SEARCH BUTTON CLICK
searchBtn.addEventListener("click", function (event) {
    event.preventDefault();

    recipeSearchResultsEl.innerHTML = '';
    youtubeVideoEl.src = "";
    youtubeVideoEl.style.display = "none";
    selectedIngredientsEl.innerHTML = '';
    rightWrapContainer.style.display = "flex";

    var ingred = document.getElementById('form1').value;
    var ingred2 = document.getElementById('form2').value;
    var ingred3 = document.getElementById('form3').value;
    var allIngreds = [ingred, ingred2, ingred3].filter(Boolean).join(',');

    var url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${allIngreds}&number=10&apiKey=${spoonacularAPIKey}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                modal.style.display = "block";
            } else {
                showSearchResults(data);
            }
        })
        .catch(err => {
            console.error(err);
            alert("Error fetching recipes. Please try again.");
        });
});

// --- SHOW SEARCH RESULTS (cards)
function showSearchResults(data) {
    recipeSearchResultsEl.innerHTML = '';
    data.forEach(recipe => {
        var li = document.createElement('li');
        li.classList.add("recipe-card");
        li.style.cssText = "cursor:pointer; list-style:none; margin:15px; max-width:300px; width:100%; display:flex; justify-content:center;";
        li.setAttribute("data-id", recipe.id);
        li.setAttribute("data-title", recipe.title);
        li.setAttribute("data-image", recipe.image);

        li.innerHTML = `
            <div class="card mb-3" style="transition: transform 0.3s, box-shadow 0.3s; display:flex; flex-direction:column; align-items:center;">
                <img src="${recipe.image}" class="card-img-top" style="width:100%; height:180px; border-radius:10px; object-fit:cover;">
                <div class="card-body" style="text-align:center;">
                    <h3 style="font-family:'Barlow Condensed', sans-serif; font-size:1.1em;">${recipe.title}</h3>
                    <p style="font-size:0.9em; color:#555;">Click to see full recipe & video</p>
                </div>
            </div>
        `;

        li.addEventListener("mouseover", () => {
            li.querySelector(".card").style.transform = "scale(1.03)";
            li.querySelector(".card").style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
        });
        li.addEventListener("mouseout", () => {
            li.querySelector(".card").style.transform = "scale(1)";
            li.querySelector(".card").style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        });

        recipeSearchResultsEl.appendChild(li);
    });
}

// --- CLICK ON RECIPE CARD (load details)
recipeSearchResultsEl.addEventListener('click', function (event) {
    var card = event.target.closest(".recipe-card");
    if (!card) return;

    selectedRecipe = card.getAttribute("data-title");
    selectedRecipeID = card.getAttribute("data-id");

    fetch(`https://api.spoonacular.com/recipes/${selectedRecipeID}/information?includeNutrition=false&apiKey=${spoonacularAPIKey}`)
        .then(res => res.json())
        .then(detail => {
            // show title
            recipeTitleEl.textContent = detail.title;

            // show ingredients + instructions + buttons
            selectedIngredientsEl.innerHTML = `
                <h4 style="font-family:'Barlow Condensed', sans-serif; margin-top:10px;">Ingredients:</h4>
                <ul style="line-height:1.6; font-size:1em;">
                    ${detail.extendedIngredients.map(i => `<li>${i.original}</li>`).join('')}
                </ul>
                <h4 style="margin-top:10px;">Instructions:</h4>
                <p style="line-height:1.6; font-size:1em;">${detail.instructions ? detail.instructions : "No detailed instructions found."}</p>
                <div style="margin-top:10px;">
                  <button id="favBtn" style="padding:8px 14px; background-color:#ff6666; color:white; border:none; border-radius:6px; cursor:pointer;"></button>
                  <button id="copyLinkBtn" style="margin-left:10px; padding:8px 14px; background-color:#008CBA; color:white; border:none; border-radius:6px; cursor:pointer;">📋 Copy Recipe Link</button>
                </div>
            `;

            // clear search results and show right section + video
            recipeSearchResultsEl.innerHTML = '';
            rightWrapContainer.style.display = "flex";
            youtubeVideoEl.style.display = "block";

            // fetch youtube video and set recipeURL
            fetch(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=${encodeURIComponent(detail.title + ' recipe')}&key=${youtubeAPIKey}`)
                .then(resp => resp.json())
                .then(data => {
                    if (data && data.items && data.items.length > 0) {
                        youtubeVideoEl.src = `https://www.youtube.com/embed/${data.items[0].id.videoId}`;
                        recipeURL = `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
                        saveRecipe(recipeURL); // history
                    } else {
                        youtubeVideoEl.src = "";
                        recipeURL = "";
                    }

                    // after we have recipeURL, wire up buttons
                    const favBtn = document.getElementById("favBtn");
                    const copyBtn = document.getElementById("copyLinkBtn");

                    // Set favBtn text according to favorites state
                    if (isFavorite(String(detail.id))) {
                        favBtn.textContent = "🗑️ Remove from Favorites";
                    } else {
                        favBtn.textContent = "❤️ Add to Favorites";
                    }

                    // Add click handlers (use closures so correct values are captured)
                    favBtn.onclick = function () {
                        toggleFavorite(detail.title, String(detail.id), detail.image || "", recipeURL || "");
                        // update button text right after toggling
                        if (isFavorite(String(detail.id))) {
                            favBtn.textContent = "🗑️ Remove from Favorites";
                        } else {
                            favBtn.textContent = "❤️ Add to Favorites";
                        }
                    };

                    copyBtn.onclick = function () {
                        copyRecipeLink();
                    };
                })
                .catch(err => {
                    console.error("YouTube fetch error:", err);
                    youtubeVideoEl.src = "";
                    recipeURL = "";
                });
        })
        .catch(err => {
            console.error("Recipe details error:", err);
            alert("Error fetching recipe details.");
        });
});

// --- COPY LINK
function copyRecipeLink() {
    if (!recipeURL) {
        alert("No recipe link available yet.");
        return;
    }
    navigator.clipboard.writeText(recipeURL)
        .then(() => alert("✅ Recipe link copied!"))
        .catch(() => alert("❌ Failed to copy recipe link."));
}

// --- SAVE TO HISTORY
function saveRecipe(url) {
    var savedRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || [];
    var videoList = JSON.parse(localStorage.getItem("videoList")) || [];
    if (!savedRecipes.includes(selectedRecipe)) {
        savedRecipes.push(selectedRecipe);
        videoList.push(url);
    }
    localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
    localStorage.setItem("videoList", JSON.stringify(videoList));
    showRecipeHistory();
}

// --- SHOW HISTORY
function showRecipeHistory() {
    recipeHistoryListEl.innerHTML = '';
    var savedRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || [];
    var videoList = JSON.parse(localStorage.getItem("videoList")) || [];
    if (savedRecipes.length > 0) {
        recipeHistoryContainerEl.style.display = "block";
        for (var i = 0; i < savedRecipes.length; i++) {
            var li = document.createElement('li');
            li.style.listStyle = 'none';
            var a = document.createElement('a');
            a.href = videoList[i];
            a.target = "_blank";
            a.className = "btn recipe-history__list-group-item";
            a.textContent = savedRecipes[i];
            li.appendChild(a);
            recipeHistoryListEl.appendChild(li);
        }
    } else {
        recipeHistoryContainerEl.style.display = "none";
    }
}

// --- CLEAR HISTORY
clearBtn.addEventListener('click', function () {
    localStorage.removeItem("savedRecipes");
    localStorage.removeItem("videoList");
    recipeHistoryListEl.innerHTML = '';
    recipeHistoryContainerEl.style.display = "none";
});

// --- FAVORITES HELPERS & UI ---
// Use consistent string IDs for comparison (store ids as strings)
function toggleFavorite(title, id, image, link) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    // ensure id is string
    id = String(id);

    const exists = favorites.some(f => String(f.id) === id);
    if (exists) {
        favorites = favorites.filter(f => String(f.id) !== id);
        alert(`${title} removed from Favorites.`);
    } else {
        favorites.push({ title: title, id: id, image: image, link: link });
        alert(`${title} added to Favorites.`);
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
    showFavorites();
}

function removeFavorite(id) {
    id = String(id);
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    favorites = favorites.filter(f => String(f.id) !== id);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    showFavorites();
}

function isFavorite(id) {
    id = String(id);
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    return favorites.some(f => String(f.id) === id);
}

// Render the favorites section (uses event listeners instead of inline onclick)
function showFavorites() {
    let favContainer = document.getElementById("favorite-container");
    if (!favContainer) return; // user may not have that HTML node yet
    favContainer.innerHTML = "";

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (favorites.length === 0) {
        favContainer.innerHTML = "<p style='text-align:center;'>No favorites added yet.</p>";
        return;
    }

    favorites.forEach(fav => {
        // create card wrapper
        let card = document.createElement("div");
        card.className = "favorite-card";
        card.style.cssText = "display:inline-block; margin:10px; text-align:center; width:150px;";

        // image
        let img = document.createElement("img");
        img.src = fav.image || "";
        img.style.cssText = "width:120px; height:120px; border-radius:10px; object-fit:cover; display:block; margin:0 auto;";

        // title
        let p = document.createElement("p");
        p.style.cssText = "max-width:140px; font-size:0.9em; margin:8px auto;";
        p.textContent = fav.title || "";

        // view button
        let viewBtn = document.createElement("button");
        viewBtn.textContent = "View";
        viewBtn.style.cssText = "padding:5px 10px; background:#007BFF; color:white; border:none; border-radius:4px; cursor:pointer; margin-right:6px;";
        viewBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            // If we have a stored YouTube link, open it; otherwise, load details using recipe id
            if (fav.link) {
                window.open(fav.link, "_blank");
            } else {
                // fallback: try to load recipe details in the right pane
                loadRecipeDetailsById(fav.id);
            }
        });

        // remove button
        let removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.style.cssText = "padding:5px 10px; background:#ff4d4d; color:white; border:none; border-radius:4px; cursor:pointer;";
        removeBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            removeFavorite(fav.id);
        });

        // assemble
        card.appendChild(img);
        card.appendChild(p);
        card.appendChild(viewBtn);
        card.appendChild(removeBtn);
        favContainer.appendChild(card);
    });
}

// Helper to load recipe details by ID (used by favorites view if no link)
function loadRecipeDetailsById(id) {
    // try to simulate click behavior by fetching details and populating right pane
    fetch(`https://api.spoonacular.com/recipes/${id}/information?includeNutrition=false&apiKey=${spoonacularAPIKey}`)
        .then(res => res.json())
        .then(detail => {
            recipeTitleEl.textContent = detail.title;

            selectedIngredientsEl.innerHTML = `
                <h4 style="font-family:'Barlow Condensed', sans-serif; margin-top:10px;">Ingredients:</h4>
                <ul style="line-height:1.6; font-size:1em;">
                    ${detail.extendedIngredients.map(i => `<li>${i.original}</li>`).join('')}
                </ul>
                <h4 style="margin-top:10px;">Instructions:</h4>
                <p style="line-height:1.6; font-size:1em;">${detail.instructions ? detail.instructions : "No detailed instructions found."}</p>
                <div style="margin-top:10px;">
                  <button id="favBtn" style="padding:8px 14px; background-color:#ff6666; color:white; border:none; border-radius:6px; cursor:pointer;"></button>
                  <button id="copyLinkBtn" style="margin-left:10px; padding:8px 14px; background-color:#008CBA; color:white; border:none; border-radius:6px; cursor:pointer;">📋 Copy Recipe Link</button>
                </div>
            `;

            recipeSearchResultsEl.innerHTML = '';
            rightWrapContainer.style.display = "flex";
            youtubeVideoEl.style.display = "block";

            // fetch youtube video for this recipe id/title
            fetch(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=${encodeURIComponent(detail.title + ' recipe')}&key=${youtubeAPIKey}`)
                .then(resp => resp.json())
                .then(data => {
                    if (data && data.items && data.items.length > 0) {
                        youtubeVideoEl.src = `https://www.youtube.com/embed/${data.items[0].id.videoId}`;
                        recipeURL = `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`;
                        saveRecipe(recipeURL);
                    } else {
                        youtubeVideoEl.src = "";
                        recipeURL = "";
                    }

                    // wire up fav button and copy
                    const favBtn = document.getElementById("favBtn");
                    const copyBtn = document.getElementById("copyLinkBtn");

                    if (isFavorite(String(detail.id))) {
                        favBtn.textContent = "🗑️ Remove from Favorites";
                    } else {
                        favBtn.textContent = "❤️ Add to Favorites";
                    }

                    favBtn.onclick = function () {
                        toggleFavorite(detail.title, String(detail.id), detail.image || "", recipeURL || "");
                        if (isFavorite(String(detail.id))) {
                            favBtn.textContent = "🗑️ Remove from Favorites";
                        } else {
                            favBtn.textContent = "❤️ Add to Favorites";
                        }
                    };

                    copyBtn.onclick = function () {
                        copyRecipeLink();
                    };
                })
                .catch(err => {
                    console.error("YouTube fetch error:", err);
                });
        })
        .catch(err => {
            console.error("Recipe details error:", err);
            alert("Error fetching recipe details.");
        });
}
    