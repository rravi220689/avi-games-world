from django.contrib import admin
from .models import UserProfile, Vehicle, UserVehicle, Track, RaceResult, Achievement, UserAchievement

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
