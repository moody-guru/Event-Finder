// src/script.js

document.addEventListener("DOMContentLoaded", () => {
  const findEventsButton = document.getElementById("findEventsButton");
  const eventResultsDiv = document.getElementById("eventResults");
  const geminiSection = document.getElementById("geminiSection");
  const userPreferencesTextarea = document.getElementById("userPreferences");
  const getRecommendationButton = document.getElementById(
    "getRecommendationButton"
  );
  const geminiRecommendationDiv = document.getElementById(
    "geminiRecommendation"
  );
  const keywordInput = document.getElementById("keywordInput");
  const radiusInput = document.getElementById("radiusInput");

  let fetchedEvents = []; // To store Ticketmaster results for Gemini API

  // Function to get current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          (error) => {
            let errorMessage = `Geolocation error: ${error.message}.`;
            if (error.code === error.PERMISSION_DENIED) {
              errorMessage +=
                " Please allow location access in your browser settings.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage += " Location information is unavailable.";
            } else if (error.code === error.TIMEOUT) {
              errorMessage += " The request to get user location timed out.";
            }
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        reject(new Error("Geolocation is not supported by this browser."));
      }
    });
  };

  // Intersection Observer for animating elements into view
  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add classes to make the element visible with a slight upward animation
          entry.target.classList.remove("opacity-0", "translate-y-4");
          entry.target.classList.add("opacity-100", "translate-y-0");
          // Stop observing once the element is visible
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px", // No margin around the root (viewport)
      threshold: 0.1, // Trigger when 10% of the item is visible
    }
  );

  // Event listener for finding events
  if (findEventsButton) {
    findEventsButton.addEventListener("click", async () => {
      eventResultsDiv.innerHTML =
        '<p class="text-center text-gray-600">Getting your current location...</p>';
      geminiSection.classList.add("hidden"); // Hide Gemini section initially
      geminiRecommendationDiv.innerHTML =
        '<p class="text-center text-gray-600">Your AI recommendation will appear here.</p>'; // Reset Gemini recommendation

      let lat, lon;
      try {
        const location = await getCurrentLocation();
        lat = location.lat;
        lon = location.lon;
        eventResultsDiv.innerHTML =
          '<p class="text-center text-gray-600">Location obtained. Searching for events from backend...</p>';
      } catch (error) {
        console.error("Geolocation error:", error);
        eventResultsDiv.innerHTML = `<p class="text-center text-red-600">Error getting your location: ${error.message}. Please allow location access and try again.</p>`;
        geminiSection.classList.add("hidden");
        return; // Stop execution if location cannot be obtained
      }

      // Get keyword and radius from input fields
      const keyword = keywordInput.value.trim();
      const radius = radiusInput.value.trim();

      // Basic validation for radius
      if (!radius || isNaN(radius) || parseInt(radius) <= 0) {
        eventResultsDiv.innerHTML =
          '<p class="text-center text-red-600">Please enter a valid positive number for the search radius.</p>';
        geminiSection.classList.add("hidden");
        return;
      }

      // --- IMPORTANT: FOR LOCAL DEVELOPMENT, USE LOCALHOST URL ---
     // const BACKEND_URL = "http://localhost:3000"; // Changed to localhost

      const BACKEND_URL = 'https://event-finder-backend-vqg3.onrender.com'; // Updated to your deployed Render URL
      // --- END IMPORTANT ---

      // Construct the URL for your backend API endpoint
      let backendUrl =
        `${BACKEND_URL}/api/places/search?` + // Updated URL
        `lat=${lat}&lon=${lon}&radius=${radius}`;

      if (keyword) {
        // Only add keyword if it's not empty
        backendUrl += `&keyword=${encodeURIComponent(keyword)}`;
      }

      try {
        const response = await fetch(backendUrl);

        if (!response.ok) {
          const errorDetails = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, details: ${errorDetails}`
          );
        }

        const data = await response.json();
        console.log("Data from Backend (Ticketmaster):", data);

        eventResultsDiv.innerHTML = ""; // Clear previous results
        fetchedEvents = []; // Clear previous events

        // Ticketmaster results are nested under _embedded.events
        if (
          data._embedded &&
          data._embedded.events &&
          data._embedded.events.length > 0
        ) {
          fetchedEvents = data._embedded.events; // Store for Gemini
          const ul = document.createElement("ul");
          ul.className = "list-none pl-0 space-y-4"; // Changed to list-none for custom styling
          data._embedded.events.forEach((event) => {
            const li = document.createElement("li");
            // Initial state for animation: hidden and slightly moved down
            li.className =
              "event-item text-gray-800 flex items-start space-x-4 p-4 bg-white rounded-lg shadow-md transition-all duration-700 ease-out opacity-0 translate-y-4"; // Added event-item class

            // Event Image
            const eventImageContainer = document.createElement("div");
            eventImageContainer.className =
              "flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200";
            const eventImage = document.createElement("img");
            eventImage.className = "w-full h-full object-cover";
            eventImage.alt = event.name;

            // Find a suitable image URL (Ticketmaster usually provides an 'images' array)
            const imageUrl =
              event.images && event.images.length > 0
                ? event.images.find(
                    (img) => img.ratio === "16_9" && img.width >= 200
                  )?.url || event.images[0].url
                : `https://placehold.co/96x96/e2e8f0/64748b?text=No+Image`; // Placeholder if no image

            eventImage.src = imageUrl;
            eventImage.onerror = () => {
              eventImage.src = `https://placehold.co/96x96/e2e8f0/64748b?text=Image+Error`; // Fallback for loading errors
            };
            eventImageContainer.appendChild(eventImage);

            // Event Details
            const eventDetails = document.createElement("div");
            eventDetails.className = "flex-grow text-left"; // Align text left
            const eventName = event.name;
            const eventDate =
              event.dates && event.dates.start && event.dates.start.localDate
                ? event.dates.start.localDate
                : "Date N/A";
            const venueName =
              event._embedded &&
              event._embedded.venues &&
              event._embedded.venues[0] &&
              event._embedded.venues[0].name
                ? event._embedded.venues[0].name
                : "Venue N/A";
            const eventUrl = event.url;

            eventDetails.innerHTML = `
                            <h3 class="text-xl font-semibold mb-1">${eventName}</h3>
                            <p class="text-sm text-gray-600">On ${eventDate} at ${venueName}</p>
                            <a href="${eventUrl}" target="_blank" class="text-blue-600 hover:underline text-sm">View Details</a>
                        `;

            li.appendChild(eventImageContainer);
            li.appendChild(eventDetails);
            ul.appendChild(li);

            // Observe the new list item for animation
            observer.observe(li);
          });
          eventResultsDiv.appendChild(ul);
          geminiSection.classList.remove("hidden"); // Show Gemini section
        } else {
          eventResultsDiv.innerHTML =
            '<p class="text-center text-gray-600">No events found for your current location and search criteria. Try a different keyword or adjust the radius.</p>';
          geminiSection.classList.add("hidden"); // Keep Gemini section hidden if no results
        }
      } catch (error) {
        console.error("Error fetching data from backend:", error);
        eventResultsDiv.innerHTML = `<p class="text-center text-red-600">Error: ${error.message}. Check console for details.</p>`;
        geminiSection.classList.add("hidden"); // Hide Gemini section on error
      }
    });
  }

  // Event listener for getting AI recommendation
  if (getRecommendationButton) {
    getRecommendationButton.addEventListener("click", async () => {
      const preferences = userPreferencesTextarea.value.trim();

      if (!preferences) {
        geminiRecommendationDiv.innerHTML =
          '<p class="text-center text-red-600">Please enter your event preferences.</p>';
        return;
      }

      if (fetchedEvents.length === 0) {
        geminiRecommendationDiv.innerHTML =
          '<p class="text-center text-red-600">Please find events first before getting an AI recommendation.</p>';
        return;
      }

      geminiRecommendationDiv.innerHTML =
        '<p class="text-center text-gray-600">Getting AI recommendation... <span class="animate-pulse">...</span></p>';

      // --- IMPORTANT: FOR LOCAL DEVELOPMENT, USE LOCALHOST URL ---
      const BACKEND_URL = "http://localhost:3000"; // Changed to localhost
      // --- END IMPORTANT ---

      try {
        const response = await fetch(`${BACKEND_URL}/api/gemini/recommend`, {
          // Updated URL
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ preferences, events: fetchedEvents }),
        });

        if (!response.ok) {
          const errorDetails = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, details: ${errorDetails}`
          );
        }

        const data = await response.json();
        console.log("Gemini Recommendation:", data);

        if (data.recommendation) {
          // Format the recommendation nicely
          const formattedRecommendation = data.recommendation.replace(
            /\n/g,
            "<br>"
          );
          geminiRecommendationDiv.innerHTML = `<p>${formattedRecommendation}</p>`;
        } else {
          geminiRecommendationDiv.innerHTML =
            '<p class="text-center text-red-600">Could not get a valid AI recommendation.</p>';
        }
      } catch (error) {
        console.error("Error getting AI recommendation:", error);
        geminiRecommendationDiv.innerHTML = `<p class="text-center text-red-600">Error: ${error.message}. Please try again.</p>`;
      }
    });
  }
});
