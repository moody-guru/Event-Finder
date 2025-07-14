// server.js

// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
let fetch; // Declare fetch here, will be assigned dynamically

// Use a dynamic import for node-fetch
// This is necessary because node-fetch v3+ is an ES Module
// and your project is configured as CommonJS.
(async () => {
  fetch = (await import("node-fetch")).default;
})();

const app = express();
const PORT = process.env.PORT || 3000; // Use port from environment variable or default to 3000

// Get Ticketmaster API key and Gemini API key from environment variables
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY; // Changed from FOURSQUARE_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Middleware to enable CORS for all origins (for development)
// In production, you'd want to restrict this to your frontend's domain.
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// API endpoint to fetch Event data from Ticketmaster
// Renamed from /api/places/search to reflect new purpose, but keeping original for frontend simplicity
app.get("/api/places/search", async (req, res) => {
  // Ensure fetch is loaded before proceeding
  if (!fetch) {
    return res
      .status(503)
      .json({ message: "Server is initializing, please try again shortly." });
  }

  // Extract query parameters from the frontend request
  // Ticketmaster uses 'latlong' and 'keyword'
  const { lat, lon, keyword, radius } = req.query;

  // Basic validation for required parameters
  if (!lat || !lon) {
    return res
      .status(400)
      .json({ message: "Latitude (lat) and Longitude (lon) are required." });
  }

  if (!TICKETMASTER_API_KEY) {
    // Changed API key variable
    console.error("TICKETMASTER_API_KEY is not set in .env file!");
    return res
      .status(500)
      .json({
        message: "Server configuration error: Ticketmaster API key missing.",
      });
  }

  // Construct the Ticketmaster Discovery API URL
  // Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/#search-events-v2
  const ticketmasterUrl =
    `https://app.ticketmaster.com/discovery/v2/events.json?` +
    `apikey=${TICKETMASTER_API_KEY}` + // API key as query param
    `&latlong=${lat},${lon}` +
    `${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ""}` +
    `${radius ? `&radius=${radius}` : ""}` + // Radius in miles for Ticketmaster
    `&unit=miles` + // Specify miles for radius
    `&size=10`; // Limit to 10 events

  console.log(`Fetching from Ticketmaster: ${ticketmasterUrl}`);

  try {
    const ticketmasterResponse = await fetch(ticketmasterUrl);

    if (!ticketmasterResponse.ok) {
      const errorText = await ticketmasterResponse.text();
      console.error(
        `Ticketmaster API error: ${ticketmasterResponse.status} - ${errorText}`
      );
      return res.status(ticketmasterResponse.status).json({
        message: "Error fetching data from Ticketmaster API",
        details: errorText,
      });
    }

    const data = await ticketmasterResponse.json();
    res.json(data); // Send the Ticketmaster data back to the frontend
  } catch (error) {
    console.error("Error in backend server (Ticketmaster fetch):", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// API endpoint to get event recommendations using Gemini API
app.post("/api/gemini/recommend", async (req, res) => {
  // Ensure fetch is loaded before proceeding
  if (!fetch) {
    return res
      .status(503)
      .json({ message: "Server is initializing, please try again shortly." });
  }

  const { preferences, events } = req.body; // Changed 'restaurants' to 'events'

  if (!preferences || !events || events.length === 0) {
    return res
      .status(400)
      .json({ message: "Preferences and a list of events are required." });
  }

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in .env file!");
    return res
      .status(500)
      .json({ message: "Server configuration error: Gemini API key missing." });
  }

  // Format events for the prompt
  // Ticketmaster event structure is different: _embedded.events[].name, _embedded.events[].dates.start.localDate, _embedded.events[].url
  const formattedEvents = events
    .map((e) => {
      const eventName = e.name;
      const eventDate =
        e.dates && e.dates.start && e.dates.start.localDate
          ? e.dates.start.localDate
          : "Date N/A";
      const venueName =
        e._embedded &&
        e._embedded.venues &&
        e._embedded.venues[0] &&
        e._embedded.venues[0].name
          ? e._embedded.venues[0].name
          : "Venue N/A";
      return `- ${eventName} on ${eventDate} at ${venueName}`;
    })
    .join("\n");

  const prompt = `You are a helpful event recommendation assistant.
    The user has the following preferences for an event: "${preferences}".
    Here is a list of nearby events:
    ${formattedEvents}

    Please recommend ONE event from the list that best fits the user's preferences.
    Explain briefly why you recommend it.
    Your response should be concise and directly state the recommendation and reason.
    Example:
    Recommendation: [Event Name]
    Reason: [Brief explanation]`;

  let chatHistory = [];
  chatHistory.push({ role: "user", parts: [{ text: prompt }] });

  const payload = { contents: chatHistory };
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(
        `Gemini API error: ${geminiResponse.status} - ${errorText}`
      );
      return res.status(geminiResponse.status).json({
        message: "Error from Gemini API",
        details: errorText,
      });
    }

    const result = await geminiResponse.json();

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      const text = result.candidates[0].content.parts[0].text;
      res.json({ recommendation: text });
    } else {
      console.error("Unexpected Gemini API response structure:", result);
      res
        .status(500)
        .json({ message: "Could not get a valid recommendation from AI." });
    }
  } catch (error) {
    console.error("Error in backend server (Gemini fetch):", error);
    res
      .status(500)
      .json({
        message: "Internal server error during AI recommendation",
        error: error.message,
      });
  }
});

// Serve static files from the 'src' directory (your frontend)
app.use(express.static("src"));

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Frontend accessible at http://localhost:${PORT}/index.html`);
});
