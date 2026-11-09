from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='profile')
    guest_id = models.CharField(max_length=64, blank=True, null=True, unique=True, db_index=True)
    display_name = models.CharField(max_length=50, default='Cosmic Cadet')
    credits = models.IntegerField(default=1500)
    experience = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    equipped_vehicle = models.ForeignKey('Vehicle', on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    sound_enabled = models.BooleanField(default=True)
    music_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.user:
            return f"Profile ({self.user.username})"
        return f"Guest ({self.display_name})"

    def add_credits(self, amount):
        self.credits += max(0, amount)
        self.save(update_fields=['credits', 'updated_at'])

    def add_xp(self, amount):
        self.experience += max(0, amount)
        # 500 XP per level
        new_level = 1 + (self.experience // 600)
        if new_level > self.level:
            self.level = new_level
        self.save(update_fields=['experience', 'level', 'updated_at'])

    def get_equipped_user_vehicle(self):
        if not self.equipped_vehicle:
            first_uv = self.vehicles.first()
            if first_uv:
                self.equipped_vehicle = first_uv.vehicle
                self.save(update_fields=['equipped_vehicle'])
                return first_uv
            return None
        return self.vehicles.filter(vehicle=self.equipped_vehicle).first()


class Vehicle(models.Model):
    MODEL_TYPE_CHOICES = [
        ('speeder', 'Aero Speeder (Twin Wings)'),
        ('dart', 'Nebula Dart (Needle Needle)'),
        ('tanker', 'Heavy Cruiser (Armored Heavy)'),
        ('hyperwing', 'Quantum Striker (Forward Swept)'),
        ('voidcraft', 'Void Reaver (Stealth Interceptor)'),
    ]

    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    tagline = models.CharField(max_length=150, default="High-speed anti-gravity racer")
    description = models.TextField()
    price = models.IntegerField(default=0)  # 0 = free starting car
    tier = models.IntegerField(default=1)
    model_type = models.CharField(max_length=50, choices=MODEL_TYPE_CHOICES, default='speeder')

    # Base Stats (1 to 10 scale or absolute units)
    base_top_speed = models.FloatField(default=260.0)     # km/h or game speed
    base_acceleration = models.FloatField(default=7.0)   # thrust power
    base_handling = models.FloatField(default=6.5)       # turn responsiveness & grip
    base_shield = models.FloatField(default=100.0)       # shield integrity
    base_boost = models.FloatField(default=100.0)        # boost gauge capacity

    # Aesthetic defaults
    primary_color = models.CharField(max_length=20, default='#00f0ff')
    secondary_color = models.CharField(max_length=20, default='#ff0055')
    trail_color = models.CharField(max_length=20, default='#00f0ff')

    class Meta:
        ordering = ['price', 'tier']

    def __str__(self):
        return f"{self.name} (Tier {self.tier})"


class UserVehicle(models.Model):
    profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='vehicles')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    custom_color = models.CharField(max_length=20, blank=True, null=True)
    custom_trail = models.CharField(max_length=20, blank=True, null=True)

    # Upgrade levels (0 to 5)
    speed_upgrade = models.IntegerField(default=0)
    accel_upgrade = models.IntegerField(default=0)
    handling_upgrade = models.IntegerField(default=0)
    shield_upgrade = models.IntegerField(default=0)
    boost_upgrade = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('profile', 'vehicle')

    def __str__(self):
        return f"{self.profile} - {self.vehicle.name}"

    @property
    def effective_top_speed(self):
        return round(self.vehicle.base_top_speed * (1.0 + (self.speed_upgrade * 0.08)), 1)

    @property
    def effective_acceleration(self):
        return round(self.vehicle.base_acceleration * (1.0 + (self.accel_upgrade * 0.10)), 1)

    @property
    def effective_handling(self):
        return round(self.vehicle.base_handling * (1.0 + (self.handling_upgrade * 0.08)), 1)

    @property
    def effective_shield(self):
        return round(self.vehicle.base_shield * (1.0 + (self.shield_upgrade * 0.15)), 1)

    @property
    def effective_boost(self):
        return round(self.vehicle.base_boost * (1.0 + (self.boost_upgrade * 0.12)), 1)

    @property
    def color(self):
        return self.custom_color or self.vehicle.primary_color

    @property
    def trail(self):
        return self.custom_trail or self.vehicle.trail_color


class Track(models.Model):
    DIFFICULTY_CHOICES = [
        ('EASY', 'Cadet (Easy)'),
        ('MEDIUM', 'Pilot (Medium)'),
        ('HARD', 'Veteran (Hard)'),
        ('EXPERT', 'Cosmic Ace (Expert)'),
    ]

    THEME_CHOICES = [
        ('earth_orbit', 'Earth Orbital Ring'),
        ('asteroid_belt', 'Asteroid Belt Havoc'),
        ('deep_nebula', 'Cygnus Nebula Highway'),
        ('black_hole', 'Singularity Abyss'),
    ]

    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    tagline = models.CharField(max_length=200)
    description = models.TextField()
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='EASY')
    theme = models.CharField(max_length=30, choices=THEME_CHOICES, default='earth_orbit')
    laps = models.IntegerField(default=3)
    length_km = models.FloatField(default=3.5)
    order = models.IntegerField(default=0)

    # Visual Theme Config
    skybox_color = models.CharField(max_length=20, default='#040410')
    road_primary_color = models.CharField(max_length=20, default='#00d9ff')
    road_grid_color = models.CharField(max_length=20, default='#1e085a')
    glow_color = models.CharField(max_length=20, default='#00ffff')
    star_density = models.IntegerField(default=2000)

    # Rewards
    first_place_reward = models.IntegerField(default=1200)
    second_place_reward = models.IntegerField(default=750)
    third_place_reward = models.IntegerField(default=400)
    xp_reward = models.IntegerField(default=300)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.name} [{self.difficulty}]"


class RaceResult(models.Model):
    MODE_CHOICES = [
        ('GRAND_PRIX', 'Grand Prix (AI Circuit)'),
        ('TIME_TRIAL', 'Time Trial (Solo Hotlap)'),
        ('SURVIVAL', 'Cosmic Warp Survival'),
    ]

    profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='race_results')
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='race_results')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='GRAND_PRIX')
    difficulty = models.CharField(max_length=20, default='MEDIUM') # EASY, MEDIUM, HARD
    position = models.IntegerField(default=1)  # 1 = 1st place
    total_time_ms = models.IntegerField()      # Milliseconds (e.g., 94320 = 1:34.320)
    best_lap_ms = models.IntegerField()        # Fastest single lap
    credits_earned = models.IntegerField(default=0)
    xp_earned = models.IntegerField(default=0)
    max_speed_kmh = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.profile.display_name} - {self.track.name} (#{self.position} in {self.total_time_formatted})"

    @property
    def total_time_formatted(self):
        seconds = (self.total_time_ms / 1000) % 60
        minutes = int(self.total_time_ms / (1000 * 60))
        return f"{minutes:02d}:{seconds:06.3f}"

    @property
    def best_lap_formatted(self):
        seconds = (self.best_lap_ms / 1000) % 60
        minutes = int(self.best_lap_ms / (1000 * 60))
        return f"{minutes:02d}:{seconds:06.3f}"


class Achievement(models.Model):
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=100)
    description = models.TextField()
    badge_icon = models.CharField(max_length=50, default='fa-trophy')
    reward_credits = models.IntegerField(default=500)

    def __str__(self):
        return self.title


class UserAchievement(models.Model):
    profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('profile', 'achievement')

    def __str__(self):
        return f"{self.profile} - {self.achievement.title}"


class ArcadeGame(models.Model):
    CATEGORY_CHOICES = [
        ('platformer', 'Retro Platformer (Mario Style)'),
        ('puzzle', 'Cybernetic Match Puzzle'),
        ('shooter', 'Retro Space Shooter'),
    ]

    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=100)
    tagline = models.CharField(max_length=150)
    description = models.TextField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    icon = models.CharField(max_length=50, default='fa-gamepad')
    badge_color = models.CharField(max_length=20, default='#00f0ff')
    credit_multiplier = models.FloatField(default=1.0)
    plays_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class ArcadeScore(models.Model):
    profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='arcade_scores')
    game = models.ForeignKey(ArcadeGame, on_delete=models.CASCADE, related_name='scores')
    score = models.IntegerField()
    credits_earned = models.IntegerField(default=0)
    xp_earned = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', '-created_at']

    def __str__(self):
        return f"{self.profile.display_name} - {self.game.title}: {self.score} pts"
