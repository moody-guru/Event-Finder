Event Finder with AI Recommendations

   ✨ Project Overview
This project transforms a basic event search into an intelligent "Event Finder" application that leverages modern web technologies and AI to help users discover nearby events and get personalized recommendations. 
It fetches event data based on your current location and preferences, and then uses a Large Language Model (LLM) to suggest the best event for you, integrating frontend UI with a secure backend API proxy and AI capabilities.

   🚀 Key Features
Current Location-Based Search: Automatically detects your geographical location using the browser's Geolocation API to find events relevant to your vicinity.

Event Discovery (Ticketmaster API): Fetches a list of events from the Ticketmaster Discovery API, allowing users to search by keyword (e.g., "music," "sports," "comedy") and within a specified radius.

AI-Powered Recommendations (Gemini API): After fetching events, users can input their preferences (e.g., "casual," "energetic," "family-friendly"), and the Gemini LLM will analyze the event list and user input to provide a personalized event recommendation with a brief explanation.

Dynamic UI with Images: Displays event details along with a relevant image for each event (if available from Ticketmaster), enhancing visual appeal. Includes fallback placeholders for missing or error-prone images.

Smooth UI Animations (Intersection Observer API): Utilizes the Intersection Observer API to create subtle fade-in and slide-up animations for event listings as they scroll into view, improving the user experience.

Secure API Handling (Backend Proxy): All API calls to external services (Ticketmaster, Gemini) are routed through a Node.js Express backend server. This keeps sensitive API keys secure on the server-side and prevents their exposure in the frontend.


   🛠️ Technologies Used
Backend
Node.js: JavaScript runtime environment.

Express.js: Fast, unopinionated, minimalist web framework for Node.js, used to create the API proxy.

dotenv: Module to load environment variables from a .env file for secure API key management.

cors: Middleware to enable Cross-Origin Resource Sharing, allowing frontend and backend communication.

node-fetch: A light-weight module that brings window.fetch to Node.js, used for making HTTP requests to external APIs.


Frontend
HTML5: Structure of the web page.

CSS3 (Tailwind CSS): Utility-first CSS framework for rapid and responsive UI development. Includes custom CSS for specific dark mode styling.

JavaScript (Vanilla JS): Powers all interactive elements, API calls to the backend, geolocation, and UI animations.

Geolocation API: Browser API to obtain the user's current latitude and longitude.

Intersection Observer API: Browser API to efficiently detect when an element enters or exits the viewport, used for scroll-based animations.

External APIs
Ticketmaster Discovery API: Used to search for events based on location, keywords, and radius.

Google Gemini API: Utilized for advanced AI capabilities to generate personalized event recommendations based on user preferences and fetched event data.

⚙️ Setup Instructions
Follow these steps to get the project up and running on your local machine.

1. Prerequisites
   Node.js & npm: Make sure you have Node.js (which includes npm) installed. You can download it from nodejs.org.

Git: For cloning the repository. Download from git-scm.com.

2. Get API Keys
   You'll need two API keys:

Ticketmaster Discovery API Key:

Go to Ticketmaster Developer Portal.

Sign up/log in and create a new application to obtain your Consumer Key (API Key).

Google Gemini API Key:

Go to Google AI Studio.

Create a new API key.

3. Clone the Repository
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME # Replace YOUR_REPO_NAME with your actual repository name

4. Install Dependencies
   In the project root directory, install the necessary Node.js packages:

npm install

5. Configure Environment Variables
   Create a file named .env in the root of your project directory (at the same level as package.json and server.js). Add your API keys to this file:

TICKETMASTER_API_KEY=YOUR_TICKETMASTER_API_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
PORT=3000

Important: Replace YOUR_TICKETMASTER_API_KEY and YOUR_GEMINI_API_KEY with the actual keys you obtained.
Security Note: Never commit your .env file to version control (e.g., GitHub). A .gitignore file has been provided to prevent this.

6. Run the Application
   You'll need to run two separate commands in two different terminal windows:

a. Start the Backend Server
In your first terminal, from the project root:

npm start

This will start the Express server, which will serve your frontend files and handle API requests to Ticketmaster and Gemini. You should see output like:
Backend server running on http://localhost:3000
Frontend accessible at http://localhost:3000/index.html

# Check your package.json scripts for the exact command, e.g.:

npm run build:css

This command typically watches for changes in your source files and compiles output.css. For this project, the Tailwind CDN is used, so this step is less critical unless you have specific custom Tailwind configurations.

7. Access the Frontend
   Once the backend server is running, open your web browser and navigate to:

http://localhost:3000/index.html

🚀 Usage
Allow Geolocation: When the page loads and you click "Find Events," your browser will likely ask for permission to access your location. You must allow this for the app to find nearby events.

Search for Events:

Enter a Search Keyword (e.g., "music", "sports", "comedy", or leave blank for all events).

Adjust the Search Radius (in miles) to broaden or narrow your search.

Click the "Find Events" button.

Get AI Recommendation:

After events are listed, the "Get an AI Recommendation" section will appear.

Enter your Event Preferences (e.g., "something relaxing," "a lively concert," "family-friendly activity").

Click the "Get AI Recommendation ✨" button to receive a personalized suggestion from the Gemini AI.

<img width="1917" height="1022" alt="image" src="https://github.com/user-attachments/assets/1ef912e2-c185-476a-92e8-5758b574d50e" />
<img width="1919" height="1028" alt="image" src="https://github.com/user-attachments/assets/fdb48099-7f6f-4862-a557-a0b7178228ef" />


📄 License
This project is open-source and available under the MIT License.
