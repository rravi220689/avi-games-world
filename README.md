# AVI GAMES WORLD 🚀🎮

A premier futuristic web gaming portal built with **Python 3.14**, **Django 6**, **PostgreSQL**, **Three.js**, and the **Web Audio API**. Featuring anti-gravity 3D space racing with multiple difficulty modes, track hurdles, slipstream AI, plus an Arcade Hub with Mario-style gold mining, gem puzzle match-3, and retro space invaders.

GitHub Repository: [https://github.com/rravi220689/avi-games-world](https://github.com/rravi220689/avi-games-world)
Active Branch: `dev`

---

## 🌟 Game Highlights

### 1. 3D Anti-Gravity Space GP
- **Difficulty Modes**:
  - **Simple (Easy)**: Relaxed cruise speeds, gentle AI, low hurdle density.
  - **Middle (Medium)**: Competitive racing speeds, alert AI, balanced hurdles.
  - **Hard**: Extreme hyper-drive speeds, cutthroat AI, frequent pulsing electric hurdle gates (+60% Credit & XP bonus!).
- **Dynamic Track Hurdles**:
  - Pulsing electric laser gates with energy arcs.
  - Collision damage, temporary velocity drag, and mobile haptic vibration (`navigator.vibrate(120)`).
- **Competitive AI Opponents**:
  - Slipstream drafting and aggressive overtaking tactics.
  - Real-time sector positioning and live radar minimap.
- **5 Sci-Fi Spacecraft**: `Aero Viper`, `Nebula Dart`, `Titan Vanguard`, `Quantum Striker`, `Void Reaver`.
- **Hangar & Tuning Garage**: Upgrade Engine, Thrusters, Handling, Shields, and Nitro up to Mk V, plus custom hull paint and jet trail colors.

### 2. Multi-Game Arcade Hub (Unified Economy)
- **Super Cosmic Gold Rush (Mario-Inspired Platformer)**:
  - Smash glowing `[?]` blocks from underneath for coins.
  - Stomp purple alien crawlers to clear platforms.
  - Double-tap jump for rocket-thruster jet leaps.
- **Quantum Nova: Space Gem Match (Cyberpunk Puzzle)**:
  - Match 3 or more plasma gems (Ruby, Cyan, Gold, Emerald, Amethyst).
  - Chain reaction cascading gravity physics and Supernova combo detonations.
- **Cosmic Invaders: Void Defense (Retro Space Shooter)**:
  - Defend orbital shields with twin laser starfighter artillery.
  - Destructible energy bunkers and alien armada formations.
- **Unified Credit Economy**:
  - Credits (CC) and XP earned across any game sync directly to your player account and can be spent on vehicle upgrades in the Hangar.

### 3. Full Mobile Compatibility
- Responsive viewport scaling and touch pads:
  - Left / Right directional touch buttons
  - Nitro Warp & Accelerator Boost triggers
  - Jump & Jet thrust buttons for platformer
  - Plasma laser triggers for arcade shooter
  - Haptic feedback on collisions and boosts

### 4. Built-in Security & Web Application Firewall (WAF)
- **CosmicShieldFirewallMiddleware**:
  - SQL injection pattern interception
  - XSS and script injection filtering
  - Directory path traversal blocking (`../`)
  - Sliding-window IP rate limiting (anti-flood/DoS shield)
  - Enforced security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`).

### 5. High-Performance PostgreSQL Database
- **Host**: `160.191.14.69`
- **Port**: `5433`
- **Database**: `space_car_racing_db`
- **Username**: `appadmin`
- **Persistent Connection Pooling**: `CONN_MAX_AGE = 600` for low-latency queries.

---

## 🕹️ Controls Guide

### 🏎️ 3D Space Car Racing
| Key / Touch | Action |
|---|---|
| `W` / `↑` / `BOOST` | Throttle / Acceleration |
| `S` / `↓` / `BRAKE` | Brake / Reverse |
| `A` / `←` / `LEFT` | Steer Left |
| `D` / `→` / `RIGHT` | Steer Right |
| `SPACE` / `NITRO` | Instant Warp Nitro Discharge |
| `SHIFT` | Sustained Afterburner Nitro |
| `C` | Toggle Camera (Chase, Close, Cockpit) |
| `R` | Reset Craft to Track Center |
| `M` | Mute / Unmute Audio Synthesizer |
| **Touch / Mouse Drag** | Glide finger or mouse to steer smoothly |

### 🪙 Super Cosmic Gold Rush
| Key / Touch | Action |
|---|---|
| `A` / `D` or `←` / `→` | Run Left / Right |
| `SPACE` / `W` / `↑` | Jump / Smash `[?]` Blocks |
| `DOUBLE SPACE` | Thruster Jet Jump |

### 💎 Quantum Nova: Gem Match
| Action | Description |
|---|---|
| **Tap / Click** | Click two adjacent gems to swap and form combos of 3+ |

### 👾 Cosmic Invaders: Void Defense
| Key / Touch | Action |
|---|---|
| `A` / `D` or `←` / `→` | Move Starfighter |
| `SPACE` / `W` / `FIRE` | Fire Plasma Laser Artillery |

---

## 🚀 Quickstart

1. **Activate Virtualenv**:
   ```bash
   source venv/bin/activate
   ```

2. **Run Migrations & Seed Game Data**:
   ```bash
   python manage.py migrate
   python manage.py seed_data
   ```

3. **Start Development Server**:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

4. **Run Automated Test Suite**:
   ```bash
   python manage.py test game
   ```
