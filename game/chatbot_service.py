"""
Cosmic AI Help Assistant & Suggestion Processing Service
Answers pilot questions about Avi Games World, game controls, difficulty modes,
hurdles, hangar tuning, arcade games, and saves suggestions & chat interactions into database.
"""

import re
from .models import ContactMessage, ChatInteraction

class CosmicChatbotService:
    SITE_NAME = "Avi Games World"

    # Pre-defined knowledge base topics with high-precision keywords
    KNOWLEDGE_BASE = [
        {
            'intent': 'controls_racing',
            'keywords': ['control', 'controls', 'drive', 'steering', 'steer', 'nitro', 'brake', 'boost', 'pedal', 'drift', 'keys', 'how to play racing', 'arrow keys', 'wasd'],
            'answer': (
                "🏎️ **3D Space Car Racing Controls**:\n\n"
                "• **Desktop / Keyboard**:\n"
                "  - `W` or `↑` : Throttle / Accelerate (Auto-cruise also assists!)\n"
                "  - `S` or `↓` : Brake / Reverse\n"
                "  - `A` / `D` or `←` / `→` : Steer Left / Right\n"
                "  - `SPACE` : Instant Warp Nitro Burst\n"
                "  - `SHIFT` : Sustained Afterburner Nitro\n"
                "  - `C` : Switch Camera (Dynamic Chase, Close Action, Cockpit)\n"
                "  - `R` : Instant Track Center Reset\n"
                "  - `M` : Mute / Unmute Audio Synthesizer\n"
                "• **Mobile & Tablets**:\n"
                "  - Use on-screen touch pedals: `LEFT`, `RIGHT`, `NITRO`, `BRAKE`, and `BOOST`.\n"
                "  - You can also drag your finger across the screen for fluid analog steering!"
            )
        },
        {
            'intent': 'difficulty_hurdles',
            'keywords': ['difficulty', 'hard', 'medium', 'middle', 'easy', 'simple', 'hurdle', 'hurdles', 'laser', 'gate', 'hazard', 'mode', 'modes'],
            'answer': (
                "⚡ **Difficulty Modes & Track Hurdles**:\n\n"
                "• **Simple (Easy)**: Relaxed cruise velocity, forgiving AI, fewer track hazards.\n"
                "• **Middle (Medium)**: True Grand Prix championship speed, competitive AI racers.\n"
                "• **Hard Mode**: Hyper-drive velocity, aggressive slipstream drafting AI, and dense **Pulsing Electric Laser Gates** (+**60% Cosmic Credits & XP bonus**!).\n\n"
                "⚠️ **Track Hazards**: Colliding with electric laser gate hurdles drains your deflector shields, causes temporary velocity drag, and triggers haptic vibrations on mobile devices!"
            )
        },
        {
            'intent': 'hangar_tuning',
            'keywords': ['hangar', 'garage', 'upgrade', 'car', 'cars', 'vehicle', 'vehicles', 'ship', 'ships', 'viper', 'dart', 'vanguard', 'striker', 'reaver', 'paint', 'color', 'tune'],
            'answer': (
                "🛸 **The Hangar & Tuning Garage**:\n\n"
                "• **5 Space Racers**:\n"
                "  1. `Aero Viper` — Balanced Cadet Interceptor.\n"
                "  2. `Nebula Dart` — Lightweight needle racer with supreme agility.\n"
                "  3. `Titan Vanguard` — Heavy armor, maximum deflector shields.\n"
                "  4. `Quantum Striker` — Tachyonic pulse drive with deep boost capacity.\n"
                "  5. `Void Reaver` — Apex singularity speedster (highest top speed).\n\n"
                "• **Subsystem Upgrades (Mk I to Mk V)**: Ion Velocity Engine (Speed), Graviton Thrusters (Accel), Magnetic Stabilizers (Handling), Deflector Shield Core, Warp Nitro.\n"
                "• **Custom Livery**: Paint your vehicle's hull and customize neon jet engine flame trail colors in real-time 3D!"
            )
        },
        {
            'intent': 'arcade_games',
            'keywords': ['arcade', 'mario', 'gold rush', 'puzzle', 'gem', 'quantum nova', 'invaders', 'shooter', 'void invaders', 'minigame', 'mini game'],
            'answer': (
                "🎮 **Avi Games World Arcade Hub** (`/arcade/`):\n\n"
                "1. **Super Cosmic Gold Rush**:\n"
                "   - Mario-style retro platformer. Jump and smash **[?]** blocks from below to gather shiny gold coins.\n"
                "   - Stomp alien crawlers and double-tap jump for jet thruster leaps.\n\n"
                "2. **Quantum Nova: Gem Match**:\n"
                "   - Cyberpunk match-3 puzzle with cascading gravity physics.\n"
                "   - Match 3+ plasma gems (Ruby, Cyan, Gold, Emerald, Amethyst) to trigger Supernova chain reactions.\n\n"
                "3. **Cosmic Invaders: Void Defense**:\n"
                "   - Retro space arcade shooter. Pilot your starfighter behind destructible bunkers and annihilate alien fleet armada waves.\n\n"
                "💰 *All arcade scores earn Cosmic Credits synced directly to your pilot account!*"
            )
        },
        {
            'intent': 'credits_economy',
            'keywords': ['credit', 'credits', 'cc', 'xp', 'level', 'money', 'earn', 'gold', 'reward', 'rewards', 'economy'],
            'answer': (
                "🪙 **Unified Cosmic Economy & XP**:\n\n"
                "• Every game in Avi Games World awards **Cosmic Credits (CC)** and **Pilot XP**:\n"
                "  - Podium finishes in 3D Space Racing (1.6x bonus on Hard mode).\n"
                "  - Smashing gold blocks in Super Cosmic Gold Rush.\n"
                "  - Cascading combo matches in Quantum Nova.\n"
                "  - Defending sectors in Cosmic Invaders.\n"
                "• Spend your pooled Cosmic Credits in **The Hangar** on spaceship purchases and subsystem upgrades (Mk I → Mk V)!"
            )
        },
        {
            'intent': 'site_info_creator',
            'keywords': ['who', 'about', 'avi', 'creator', 'site info', 'avi games', 'what is this site', 'features'],
            'answer': (
                "🌐 **About Avi Games World**:\n\n"
                "Avi Games World is a high-speed futuristic gaming portal engineered with Python Django, PostgreSQL, Three.js 3D WebGL, and procedural Web Audio.\n\n"
                "It combines high-adrenaline 3D anti-gravity racing across floating cosmic circuits with classic arcade games (Mario Gold Rush, Gem Match-3, Space Invaders), an integrated tuning garage, and a unified economy.\n\n"
                "Built with active security firewalls (WAF), mobile touch controls, and high-performance cloud databases."
            )
        },
    ]

    # Regex patterns that indicate user wants to submit feedback or suggestion
    SUGGESTION_PATTERNS = [
        r'(?:my\s+)?suggestion(?:\s+is)?[:\s]+(.+)',
        r'(?:i\s+want\s+to\s+suggest|i\s+suggest|suggest\s+that)[:\s]+(.+)',
        r'(?:new\s+idea|feature\s+request|my\s+idea)[:\s]+(.+)',
        r'(?:can\s+you\s+add|please\s+add|how\s+about\s+adding)[:\s]+(.+)',
        r'(?:bug\s+report|found\s+a\s+bug|glitch)[:\s]+(.+)',
        r'(?:feedback|feedback\s+is)[:\s]+(.+)',
        r'(?:contact\s+avi|message\s+avi)[:\s]+(.+)',
    ]

    @classmethod
    def process_message(cls, user_text, session_id, profile=None, name="Guest Pilot", email=""):
        """
        Processes a user message:
        1. Checks if it contains a suggestion/feedback/bug report to save into ContactMessage.
        2. Matches knowledge base for accurate answers.
        3. Saves interaction log into ChatInteraction table.
        4. Returns answer dict with metadata.
        """
        user_text_clean = user_text.strip()
        lower_text = user_text_clean.lower()
        
        saved_contact = None
        is_suggestion = False
        detected_category = 'suggestion'

        # 1. Check if user is submitting a suggestion or contact message
        for pattern in cls.SUGGESTION_PATTERNS:
            match = re.search(pattern, lower_text, re.IGNORECASE)
            if match:
                is_suggestion = True
                extracted_content = match.group(1).strip()
                if len(extracted_content) < 5:
                    extracted_content = user_text_clean

                if 'bug' in lower_text or 'glitch' in lower_text:
                    detected_category = 'bug_report'
                elif 'feature' in lower_text or 'add' in lower_text:
                    detected_category = 'feature_request'
                elif 'contact' in lower_text:
                    detected_category = 'contact'
                else:
                    detected_category = 'suggestion'

                # Save into ContactMessage table!
                pilot_name = profile.display_name if profile else (name or "Cosmic Pilot")
                saved_contact = ContactMessage.objects.create(
                    profile=profile,
                    name=pilot_name,
                    email=email,
                    category=detected_category,
                    subject=f"Chatbot {detected_category.replace('_', ' ').title()}: {user_text_clean[:45]}",
                    message=user_text_clean,
                    source='chatbot'
                )
                break

        # If user explicitly asks "how to suggest" or "how to contact"
        if not is_suggestion and any(w in lower_text for w in ['suggest', 'feedback', 'contact', 'report']):
            if len(user_text_clean.split()) > 4:
                # User typed a sentence like "you should add multiplayer racing" or "add motorcycle"
                is_suggestion = True
                pilot_name = profile.display_name if profile else (name or "Cosmic Pilot")
                saved_contact = ContactMessage.objects.create(
                    profile=profile,
                    name=pilot_name,
                    email=email,
                    category='suggestion',
                    subject=f"Chatbot Suggestion: {user_text_clean[:45]}",
                    message=user_text_clean,
                    source='chatbot'
                )

        # 2. Formulate bot response
        if is_suggestion and saved_contact:
            bot_reply = (
                f"✨ **Thank you, {saved_contact.name}!**\n\n"
                f"Your {saved_contact.get_category_display().lower()} has been securely saved in the **Avi Games World** database (Ref **#{saved_contact.id}**).\n\n"
                f"Avi and the development crew review all suggestions to help shape future updates, tracks, and arcade games! You can also check our full contact page at `/contact/` anytime."
            )
            detected_intent = 'suggestion_submitted'
        else:
            # 3. Match against Knowledge Base
            best_match = None
            max_score = 0

            for topic in cls.KNOWLEDGE_BASE:
                score = sum(1 for kw in topic['keywords'] if kw in lower_text)
                if score > max_score:
                    max_score = score
                    best_match = topic

            if best_match and max_score > 0:
                bot_reply = best_match['answer']
                detected_intent = best_match['intent']
            else:
                # Fallback friendly response with topic suggestions
                bot_reply = (
                    "👋 **Hello Pilot! I am your Avi Games World AI Guide.**\n\n"
                    "I can help you with:\n"
                    "• 🏎️ **Racing Controls**: Ask about keyboard keys or mobile touch steering.\n"
                    "• ⚡ **Difficulty & Hurdles**: Learn about Simple, Middle, Hard modes & laser hazards.\n"
                    "• 🛸 **The Hangar**: How to unlock and tune vehicles (Mk I → Mk V).\n"
                    "• 🎮 **Arcade Games**: Super Cosmic Gold Rush, Gem Match-3 & Void Invaders.\n"
                    "• 🪙 **Cosmic Credits**: How to earn CC and spend on upgrades.\n"
                    "• 💡 **Suggestions & Feedback**: Type any idea (e.g. *\"Suggestion: add more tracks\"*) and I will save it directly to our database!\n\n"
                    "What would you like to know?"
                )
                detected_intent = 'general_fallback'

        # 4. Save interaction log to ChatInteraction table
        ChatInteraction.objects.create(
            session_id=session_id[:100],
            profile=profile,
            user_query=user_text_clean,
            bot_response=bot_reply,
            detected_intent=detected_intent,
            suggestion_saved=saved_contact
        )

        return {
            'reply': bot_reply,
            'intent': detected_intent,
            'suggestion_saved': bool(saved_contact),
            'suggestion_id': saved_contact.id if saved_contact else None
        }
