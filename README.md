# COSMIC OVERDRIVE: 3D Anti-Gravity Space GP 🚀🏎️

A full-featured, high-speed 3D space car racing game built with **Python 3.14**, **Django 6**, **PostgreSQL**, **Three.js**, and the **Web Audio API**.

---

## 🌟 Key Features

### 1. 3D WebGL Space Racing Engine
- **Full 3D Tracks**: Floating cosmic highways winding through outer space with glowing neon guide rails, magnetic grip assist, elevation drops, and banked turns.
- **5 Unlockable Futuristic Space Vessels**:
  - `Aero Viper` (Cadet interceptor - balanced)
  - `Nebula Dart` (Ultralight needle racer - extreme cornering)
  - `Titan Vanguard` (Heavy dreadnought - maximum deflectors & top speed)
  - `Quantum Striker` (Tachyonic pulse drive - sustained nitro)
  - `Void Reaver` (Apex singularity speedster - dark matter alloy)
- **Competitive AI Racers**: Dynamic AI rivals (`Nova-7`, `Apex-V`, `Vortex-X`) with real-time lap and sector ranking.
- **Speed Booster Pads**: Glowing golden chevron pads that launch craft into hyper-acceleration.
- **Built-in Web Audio Synthesizer**: Procedural sci-fi engine pitch modulation, nitro whoosh, collision crunches, and algorithmic synthwave music loops without needing external audio files.
- **Multiple Camera Views**: Dynamic Chase Cam, Close Action Cam, and Cockpit / Hood Cam (toggle with `C`).

### 2. Simple, Intuitive & Attractive Controls
- **Auto-Cruise Assist**: Smooth cruise acceleration enabled by default so you can focus on thrilling cornering and boosts!
- **Keyboard Controls**:
  - `W` / `↑` : Throttle / Accelerate
  - `S` / `↓` : Brake / Reverse
  - `A` / `←` : Steer Left
  - `D` / `→` : Steer Right
  - `SPACE` : Instant Warp Nitro Discharge
  - `SHIFT` : Sustained Nitro Boost
  - `C` : Toggle Camera View
  - `R` : Reset Position
  - `M` : Toggle Sound Mute
- **Mouse / Touch Drag Steering**: Simply click and move your mouse or drag your finger across the screen to glide smoothly across the track.
- **On-Screen Touch Buttons**: Dedicated responsive touch buttons for mobile and tablet players.

### 3. The Hangar & Tuning Garage
- **Interactive 3D Viewer**: Rotate and inspect your space roadster in 3D.
- **Subsystem Upgrades (Mk I to Mk V)**:
  - *Ion Velocity Engine* (Increases Top Speed)
  - *Graviton Thrusters* (Increases Acceleration)
  - *Magnetic Stabilizers* (Increases Handling Grip)
  - *Deflector Shield Core* (Increases Shield Capacity)
  - *Warp Nitro Reservoir* (Increases Boost Duration)
- **Livery & Neon Trail Customizer**: Real-time color pickers for custom hull paint and ion jet flame trail.

### 4. Built-in Security & Web Application Firewall (WAF)
- **Cosmic Shield Firewall Middleware**:
  - SQL injection pattern interception
  - XSS and script tag inspection
  - Path traversal blocking (`../`)
  - Sliding-window IP rate limiting (anti-flood/DoS shield)
  - Enforced security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`).

### 5. PostgreSQL Database Architecture
- **Host**: `160.191.14.69`
- **Port**: `5433`
- **Database**: `space_car_racing_db`
- **Username**: `appadmin`
- **Persistent Connection Pooling**: `CONN_MAX_AGE = 600` for low-latency queries.

---

## 🎮 How to Access the Live Site

The Django server is running at:
- **Game URL**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Circuits**: [http://127.0.0.1:8000/tracks/](http://127.0.0.1:8000/tracks/)
- **Hangar / Garage**: [http://127.0.0.1:8000/hangar/](http://127.0.0.1:8000/hangar/)
- **Leaderboards**: [http://127.0.0.1:8000/leaderboards/](http://127.0.0.1:8000/leaderboards/)
- **Pilot Dossier**: [http://127.0.0.1:8000/profile/](http://127.0.0.1:8000/profile/)
- **Admin Dashboard**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)
  - *Username*: `admin`
  - *Password*: `AdminSpace2026!`
