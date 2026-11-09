from django.core.management.base import BaseCommand
from game.models import Vehicle, Track, Achievement, UserProfile, RaceResult
import random

class Command(BaseCommand):
    help = 'Seeds initial space vehicles, race tracks, achievements, and rival records'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Space Vehicles...")
        vehicles_data = [
            {
                'slug': 'aero-viper',
                'name': 'Aero Viper',
                'tagline': 'All-around aerodynamic interceptor with dual plasma stabilizers',
                'description': 'The standard-issue planetary federation racer. Perfectly balanced handling, solid acceleration, and stable graviton dampeners make it ideal for cadets and veterans alike.',
                'price': 0,
                'tier': 1,
                'model_type': 'speeder',
                'base_top_speed': 250.0,
                'base_acceleration': 7.0,
                'base_handling': 7.0,
                'base_shield': 100.0,
                'base_boost': 100.0,
                'primary_color': '#00f0ff',
                'secondary_color': '#0055ff',
                'trail_color': '#00ffff',
            },
            {
                'slug': 'nebula-dart',
                'name': 'Nebula Dart',
                'tagline': 'Ultralight needle-frame craft built for extreme cornering',
                'description': 'Constructed from ultralight carbon-aerogel, the Nebula Dart snaps into hairpin turns with zero inertia penalty. Sacrifices shield integrity for blistering acceleration.',
                'price': 1200,
                'tier': 1,
                'model_type': 'dart',
                'base_top_speed': 270.0,
                'base_acceleration': 8.5,
                'base_handling': 9.0,
                'base_shield': 75.0,
                'base_boost': 110.0,
                'primary_color': '#ff0077',
                'secondary_color': '#ffaa00',
                'trail_color': '#ff00aa',
            },
            {
                'slug': 'titan-vanguard',
                'name': 'Titan Vanguard',
                'tagline': 'Heavy armored dreadnought racer with kinetic ram deflectors',
                'description': 'Forged in orbital asteroid foundries, this juggernaut shatters space debris and shrugs off violent impacts. Features overwhelming top-end momentum.',
                'price': 2800,
                'tier': 2,
                'model_type': 'tanker',
                'base_top_speed': 295.0,
                'base_acceleration': 6.2,
                'base_handling': 5.8,
                'base_shield': 160.0,
                'base_boost': 90.0,
                'primary_color': '#00ff66',
                'secondary_color': '#112233',
                'trail_color': '#00ff88',
            },
            {
                'slug': 'quantum-striker',
                'name': 'Quantum Striker',
                'tagline': 'Forward-swept experimental racer powered by tachyonic pulse drive',
                'description': 'Equipped with an oversized hyper-drive capacitor, the Quantum Striker delivers sustained nitro burns that tear through the cosmic vacuum at supersonic velocities.',
                'price': 5500,
                'tier': 3,
                'model_type': 'hyperwing',
                'base_top_speed': 325.0,
                'base_acceleration': 9.2,
                'base_handling': 8.0,
                'base_shield': 110.0,
                'base_boost': 150.0,
                'primary_color': '#ff8800',
                'secondary_color': '#ffff00',
                'trail_color': '#ffaa00',
            },
            {
                'slug': 'void-reaver',
                'name': 'Void Reaver',
                'tagline': 'Apex singularity speedster engineered from dark matter alloy',
                'description': 'The pinnacle of intergalactic motorsport engineering. Feeds directly on zero-point radiation, providing peerless speed, telepathic handling, and unmatched prestige.',
                'price': 10000,
                'tier': 4,
                'model_type': 'voidcraft',
                'base_top_speed': 360.0,
                'base_acceleration': 9.8,
                'base_handling': 9.5,
                'base_shield': 130.0,
                'base_boost': 160.0,
                'primary_color': '#9d00ff',
                'secondary_color': '#00e1ff',
                'trail_color': '#bc13fe',
            },
        ]

        for v_data in vehicles_data:
            v, created = Vehicle.objects.update_or_create(slug=v_data['slug'], defaults=v_data)
            self.stdout.write(f"  {'Created' if created else 'Updated'} vehicle: {v.name}")

        self.stdout.write("Seeding Race Tracks...")
        tracks_data = [
            {
                'slug': 'orbital-station-zero',
                'name': 'Orbital Station Zero',
                'tagline': 'Low Earth Orbit Ring with sprawling cosmic cityscapes',
                'description': 'Glide high above the blue marble of Earth through pressurized magnetic vacuum tubes and sweeping solar array straights. The proving ground for new cadets.',
                'difficulty': 'EASY',
                'theme': 'earth_orbit',
                'laps': 3,
                'length_km': 3.2,
                'order': 1,
                'skybox_color': '#030617',
                'road_primary_color': '#00e5ff',
                'road_grid_color': '#0d1b4a',
                'glow_color': '#00f0ff',
                'first_place_reward': 1000,
                'second_place_reward': 600,
                'third_place_reward': 350,
                'xp_reward': 250,
            },
            {
                'slug': 'asteroid-belt-havoc',
                'name': 'Asteroid Belt Havoc',
                'tagline': 'Hazardous debris corridor inside the Jovian Asteroid Field',
                'description': 'Maneuver past rotating mineral megablocks and gravitational anomalies. The track twists violently through fractured asteroids with tight chicanes.',
                'difficulty': 'MEDIUM',
                'theme': 'asteroid_belt',
                'laps': 3,
                'length_km': 4.1,
                'order': 2,
                'skybox_color': '#110603',
                'road_primary_color': '#ff9100',
                'road_grid_color': '#421603',
                'glow_color': '#ffaa00',
                'first_place_reward': 1500,
                'second_place_reward': 900,
                'third_place_reward': 500,
                'xp_reward': 400,
            },
            {
                'slug': 'cygnus-nebula-highway',
                'name': 'Cygnus Nebula Highway',
                'tagline': 'Stardust superhighway surrounded by glowing purple ionization clouds',
                'description': 'High elevation drops and sweeping supersonic banked turns. Catch cosmic energy streams for limitless boost chains along deep purple stellar gases.',
                'difficulty': 'HARD',
                'theme': 'deep_nebula',
                'laps': 3,
                'length_km': 5.0,
                'order': 3,
                'skybox_color': '#0c031c',
                'road_primary_color': '#e000ff',
                'road_grid_color': '#310659',
                'glow_color': '#f000ff',
                'first_place_reward': 2200,
                'second_place_reward': 1300,
                'third_place_reward': 700,
                'xp_reward': 600,
            },
            {
                'slug': 'singularity-abyss',
                'name': 'Singularity Abyss',
                'tagline': 'Extreme velocity spiral skirting the event horizon of a supermassive black hole',
                'description': 'Time dilates as gravity curves the space-track into breathtaking multi-axis corkscrews. Only the galaxy’s elite dare breach this threshold.',
                'difficulty': 'EXPERT',
                'theme': 'black_hole',
                'laps': 4,
                'length_km': 6.2,
                'order': 4,
                'skybox_color': '#020005',
                'road_primary_color': '#ffe600',
                'road_grid_color': '#332700',
                'glow_color': '#ffcc00',
                'first_place_reward': 3500,
                'second_place_reward': 2000,
                'third_place_reward': 1100,
                'xp_reward': 1000,
            },
        ]

        for t_data in tracks_data:
            t, created = Track.objects.update_or_create(slug=t_data['slug'], defaults=t_data)
            self.stdout.write(f"  {'Created' if created else 'Updated'} track: {t.name}")

        self.stdout.write("Seeding Achievements...")
        achievements_data = [
            {
                'slug': 'first_win',
                'title': 'Podium Ascendant',
                'description': 'Take 1st place in any Grand Prix space race.',
                'badge_icon': 'fa-trophy',
                'reward_credits': 500,
            },
            {
                'slug': 'speed_demon',
                'title': 'Speed of Light',
                'description': 'Reach a maximum speed of 300 km/h or higher.',
                'badge_icon': 'fa-bolt',
                'reward_credits': 750,
            },
            {
                'slug': 'space_drifter',
                'title': 'Gravitational Drift',
                'description': 'Drift sideways around corners while maintaining boost.',
                'badge_icon': 'fa-fire',
                'reward_credits': 400,
            },
            {
                'slug': 'cosmic_mechanic',
                'title': 'Cosmic Engineer',
                'description': 'Upgrade any system of your space racer in the Hangar.',
                'badge_icon': 'fa-wrench',
                'reward_credits': 500,
            },
            {
                'slug': 'fleet_commander',
                'title': 'Fleet Commander',
                'description': 'Acquire 3 or more anti-gravity racers in your garage.',
                'badge_icon': 'fa-rocket',
                'reward_credits': 1500,
            },
            {
                'slug': 'abyss_champion',
                'title': 'Event Horizon Escape',
                'description': 'Conquer the Singularity Abyss track in 1st place.',
                'badge_icon': 'fa-atom',
                'reward_credits': 3000,
            },
        ]

        for a_data in achievements_data:
            a, created = Achievement.objects.update_or_create(slug=a_data['slug'], defaults=a_data)
            self.stdout.write(f"  {'Created' if created else 'Updated'} achievement: {a.title}")

        # Seed AI Rival Leaderboard records
        self.stdout.write("Seeding AI Rival Leaderboard records...")
        rivals = [
            ("Vortex-9 [AI]", 14, "nebula-dart"),
            ("Astra-Prime [AI]", 22, "quantum-striker"),
            ("Hyperion-X [AI]", 31, "void-reaver"),
            ("Nova-Blast [AI]", 8, "aero-viper"),
            ("Zenith-Zero [AI]", 18, "titan-vanguard"),
        ]

        for track in Track.objects.all():
            base_total = 75000 + (track.order * 22000)
            base_lap = int(base_total / track.laps)

            for i, (name, level, car_slug) in enumerate(rivals):
                profile, _ = UserProfile.objects.get_or_create(
                    guest_id=f"ai_rival_{name.lower().replace(' ', '_')}",
                    defaults={
                        'display_name': name,
                        'level': level,
                        'credits': 10000,
                    }
                )
                car = Vehicle.objects.filter(slug=car_slug).first()
                # Variance in times
                variance = i * random.randint(2500, 4500) + random.randint(100, 900)
                tot_time = base_total + variance
                best_lap = base_lap + int(variance / track.laps)

                RaceResult.objects.get_or_create(
                    profile=profile,
                    track=track,
                    mode='GRAND_PRIX',
                    defaults={
                        'vehicle': car,
                        'position': i + 1,
                        'total_time_ms': tot_time,
                        'best_lap_ms': best_lap,
                        'credits_earned': max(200, 1500 - (i * 250)),
                        'xp_earned': max(100, 400 - (i * 60)),
                        'max_speed_kmh': round(260.0 + random.uniform(10, 80), 1),
                    }
                )

        self.stdout.write(self.style.SUCCESS("Successfully seeded all game data!"))
