🚖 VIT-AP Ride Pool
A secure, student-focused ride-sharing platform designed exclusively for VIT-AP University students. This application allows students to pool rides (Cabs/Autos) to common destinations like Vijayawada Railway Station, PNBS Bus Stand, and Gannavaram Airport, helping them save money and travel safely.

✨ Features
🚀 Core Functionality
Create Rides: Hosts can publish rides with Date, Time, Vehicle Type (Auto/Cab), and Seat Capacity.
Smart Routing: Intelligent "From/To" switcher prevents selecting the same source and destination.
Real-time Feed: Browse available rides filtered by Destination and Date.
Join/Leave: Seamlessly join a ride or join the Waitlist if the ride is full.
Ride History: Expired rides automatically move to the user's Profile History.
🛡️ Safety & Security (Priority #1)
Ladies Only Mode: Female students can flag rides as "Ladies Only".
Visibility: Male users cannot view the member list of these rides.
Enforcement: Male users are physically blocked from joining these rides via database checks.
Gender Verification: Users must verify their gender (One-time action) to access safety features.
Anti-Stalking: Users cannot message ride members unless they have officially joined that specific ride.
Verified Profiles: Google Authentication ensures all users are verified students.
💬 Communication
Group Chat: Every ride has a dedicated, private group chat for coordination.
Private DM: Passengers can privately message verified co-passengers.
Auto-Expiry: Chats and rides disappear from the public feed 1 hour after the scheduled time.
🛠️ Tech Stack
Frontend: React.js, Vite
Styling: Tailwind CSS, Framer Motion (Animations)
Backend: Firebase (Firestore Database, Authentication)
Mobile: Capacitor (Converts Web App to Native Android APK)
Icons: Lucide React


⚙️ Installation & Setup
1. Clone the Repository
Bash

git clone https://github.com/your-username/vit-ap-ride-pool.git
cd vit-ap-ride-pool
2. Install Dependencies
Bash

npm install
3. Firebase Configuration
Create a project at Firebase Console.

Enable Authentication (Google Provider).

Enable Firestore Database.

Copy your firebase config keys into src/firebase.js.

4. Run Locally
Bash

npm run dev