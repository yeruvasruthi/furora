
# Furora: Minimal, warm, all‑in‑one pet app 

**Explore · Match · Care**   

Furora is a pet-friendly web application that helps users discover pet-friendly locations, manage pet care routines, track expenses, and find perfect matches for their pets.

# Features
**1. Home**  
- Introduction to the app with a clean, responsive design.  
- Quick access to all main sections.

**2. Explore**  
- Interactive map built with Leaflet, showing pet-friendly spots like parks, cafes, and trails.  
- Custom rounded map container with shadows for a polished look.  
- Custom color-coded markers based on location type.  
- "Use My Location" feature:  
  - Fetches and centers the map on the user’s current location.
  - Displays a loading state while fetching.  
  - Shows a toast message if location permission is denied.  
- Filter options for Parks, Cafes, and Trails.  
- Click on a place in the list to highlight it on the map and pan to its position.  
- Potential future integration with the OpenStreetMap Overpass API for real-world data.  

**3. Care**  
- Tabbed interface for Routines, Calendar, and Expenses.  
- Persistent data storage using localStorage.  
- Routines:  
  Add recurring pet care activities (e.g., walks, feeding, supplements).    
  Mark activities as completed for the day.  
- Calendar:  
  Overview of scheduled activities.  
- Expenses:  
  Track pet-related expenses with descriptions, categories, and amounts.  

**4. Match**  
- Find compatible pet playmates based on preferences and pet profiles.  

**5.About**  
- Information about the app’s purpose and team.  

# Technology Stack
**Frontend**: React + TypeScript  

**Styling**: Tailwind CSS

**Maps**: Leaflet

**Animations**: Framer Motion

**State Management**: React Hooks

**Data Persistence**: LocalStorage

**Build Tool**: Vite

## Folder Structure  
```graphql
src/
├── assets/         # Static assets
├── components/     # Reusable UI components
├── data/           # JSON data for spots, pets, quiz, etc.
├── modules/        # Utility functions and hooks
├── routes/         # Page components
├── styles/         # Global and component styles

```
## Clone Repository
```bash
git clone https://github.com/yeruvasruthi/furora.git
cd furora
```

## Quick start
```bash
npm install
npm run dev
```

## Generate local placeholder images (optional)
This slim pack ships without JPGs to keep size tiny. If you want sample images:
```bash
npm run gen:placeholders
```
Images will be created under `public/images`.

## Home Page

<img width="1461" height="750" alt="Screenshot 2025-08-09 at 1 59 59 AM" src="https://github.com/user-attachments/assets/b663f5c2-7e9e-4f44-a8c1-f024b591a6c8" />

## Explore Page

<img width="1453" height="788" alt="Screenshot 2025-08-09 at 2 01 26 AM" src="https://github.com/user-attachments/assets/96c691a8-65d4-4559-98e7-333530cfdd23" />

## Match Page

<img width="1454" height="786" alt="Screenshot 2025-08-09 at 2 02 23 AM" src="https://github.com/user-attachments/assets/f861179d-08f7-4155-b0ca-7f79925dfd76" />


## Care Page

<img width="1456" height="777" alt="Screenshot 2025-08-09 at 2 05 17 AM" src="https://github.com/user-attachments/assets/080f8774-565b-4bd1-97ec-680f38f3a17a" />

## Live Website
- This project is now live to test at your own pace at 'https://furora.netlify.app/about'
  
## Future Plans  

- Integrate live location data from OpenStreetMap API.

- Add authentication for saving personalized pet data.

- Expand care calendar with reminders and push notifications.

- Include community-driven reviews and ratings for locations.

- Add photo upload support for spots and pets.

## License
This project is licensed under the MIT License.
