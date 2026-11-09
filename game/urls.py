from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('tracks/', views.tracks_list, name='tracks_list'),
    path('race/<slug:slug>/', views.race_arena, name='race_arena'),
    path('hangar/', views.hangar, name='hangar'),
    path('leaderboards/', views.leaderboards, name='leaderboards'),
    path('profile/', views.profile_view, name='profile'),

    # Auth
    path('login/', views.pilot_login, name='login'),
    path('register/', views.pilot_register, name='register'),
    path('logout/', views.pilot_logout, name='logout'),

    # APIs
    path('api/race/finish/', views.api_race_finish, name='api_race_finish'),
    path('api/garage/buy/', views.api_garage_buy, name='api_garage_buy'),
    path('api/garage/equip/', views.api_garage_equip, name='api_garage_equip'),
    path('api/garage/upgrade/', views.api_garage_upgrade, name='api_garage_upgrade'),
    path('api/garage/customize/', views.api_garage_customize, name='api_garage_customize'),
    path('api/settings/update/', views.api_update_settings, name='api_update_settings'),
]
