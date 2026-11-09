from django.contrib import admin
from .models import (
    UserProfile, Vehicle, UserVehicle, Track, RaceResult,
    Achievement, UserAchievement, ArcadeGame, ArcadeScore,
    ContactMessage, ChatInteraction
)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'user', 'guest_id', 'level', 'credits', 'equipped_vehicle', 'created_at')
    search_fields = ('display_name', 'user__username', 'guest_id')
    list_filter = ('level',)

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('name', 'tier', 'price', 'model_type', 'base_top_speed', 'base_acceleration', 'base_handling')
    list_filter = ('tier', 'model_type')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(UserVehicle)
class UserVehicleAdmin(admin.ModelAdmin):
    list_display = ('profile', 'vehicle', 'speed_upgrade', 'accel_upgrade', 'handling_upgrade', 'shield_upgrade', 'boost_upgrade')
    list_filter = ('vehicle',)

@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ('name', 'difficulty', 'theme', 'laps', 'length_km', 'order')
    list_filter = ('difficulty', 'theme')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(RaceResult)
class RaceResultAdmin(admin.ModelAdmin):
    list_display = ('profile', 'track', 'vehicle', 'position', 'total_time_ms', 'best_lap_ms', 'max_speed_kmh', 'created_at')
    list_filter = ('track', 'mode', 'position')
    ordering = ('-created_at',)

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'reward_credits')

@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('profile', 'achievement', 'unlocked_at')

@admin.register(ArcadeGame)
class ArcadeGameAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'credit_multiplier', 'plays_count', 'created_at')
    prepopulated_fields = {'slug': ('title',)}

@admin.register(ArcadeScore)
class ArcadeScoreAdmin(admin.ModelAdmin):
    list_display = ('profile', 'game', 'score', 'credits_earned', 'xp_earned', 'created_at')
    list_filter = ('game',)
    ordering = ('-created_at',)

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'subject', 'source', 'is_resolved', 'created_at')
    list_filter = ('category', 'source', 'is_resolved')
    search_fields = ('name', 'email', 'subject', 'message')
    list_editable = ('is_resolved',)
    ordering = ('-created_at',)

@admin.register(ChatInteraction)
class ChatInteractionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'profile', 'detected_intent', 'user_query', 'created_at')
    list_filter = ('detected_intent',)
    search_fields = ('user_query', 'bot_response', 'session_id')
    ordering = ('-created_at',)
