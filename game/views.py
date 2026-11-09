import json
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib import messages
from django.db.models import Min, Q

from .models import (
    UserProfile, Vehicle, UserVehicle, Track,
    RaceResult, Achievement, UserAchievement,
    ArcadeGame, ArcadeScore
)
from .context_processors import get_or_create_profile


def home(request):
    """Main menu and cosmic headquarters."""
    profile = get_or_create_profile(request)
    equipped_uv = profile.get_equipped_user_vehicle()
    featured_tracks = Track.objects.all().order_by('order')[:3]
    recent_races = profile.race_results.select_related('track', 'vehicle')[:5]

    total_races = profile.race_results.count()
    first_places = profile.race_results.filter(position=1).count()
    podiums = profile.race_results.filter(position__lte=3).count()
    achievements_unlocked = profile.achievements.count()
    total_achievements = Achievement.objects.count()

    context = {
        'profile': profile,
        'equipped_uv': equipped_uv,
        'featured_tracks': featured_tracks,
        'recent_races': recent_races,
        'stats': {
            'total_races': total_races,
            'first_places': first_places,
            'podiums': podiums,
            'win_rate': round((first_places / total_races * 100), 1) if total_races > 0 else 0,
            'achievements_count': f"{achievements_unlocked}/{total_achievements}",
        }
    }
    return render(request, 'game/home.html', context)


def tracks_list(request):
    """Track selector and briefing room."""
    profile = get_or_create_profile(request)
    tracks = Track.objects.all().order_by('order')
    equipped_uv = profile.get_equipped_user_vehicle()

    tracks_data = []
    for t in tracks:
        best_result = RaceResult.objects.filter(track=t).order_by('total_time_ms').first()
        my_best = RaceResult.objects.filter(track=t, profile=profile).order_by('total_time_ms').first()
        tracks_data.append({
            'track': t,
            'best_record': best_result,
            'my_best': my_best,
        })

    context = {
        'profile': profile,
        'equipped_uv': equipped_uv,
        'tracks_data': tracks_data,
    }
    return render(request, 'game/tracks.html', context)


@ensure_csrf_cookie
def race_arena(request, slug):
    """3D Space Race game view with difficulty modes and hurdles."""
    profile = get_or_create_profile(request)
    track = get_object_or_404(Track, slug=slug)
    equipped_uv = profile.get_equipped_user_vehicle()

    difficulty = request.GET.get('diff', 'MEDIUM').upper()
    if difficulty not in ('EASY', 'MEDIUM', 'HARD'):
        difficulty = 'MEDIUM'

    if not equipped_uv:
        messages.warning(request, "No space racer equipped! Selecting starter craft.")
        starter = Vehicle.objects.first()
        equipped_uv = UserVehicle.objects.create(profile=profile, vehicle=starter)
        profile.equipped_vehicle = starter
        profile.save()

    # Pass race config as JSON
    race_config = {
        'track': {
            'id': track.id,
            'slug': track.slug,
            'name': track.name,
            'laps': track.laps,
            'length_km': track.length_km,
            'theme': track.theme,
            'difficulty_mode': difficulty,
            'skybox_color': track.skybox_color,
            'road_primary_color': track.road_primary_color,
            'road_grid_color': track.road_grid_color,
            'glow_color': track.glow_color,
            'first_reward': track.first_place_reward,
            'second_reward': track.second_place_reward,
            'third_reward': track.third_place_reward,
            'xp_reward': track.xp_reward,
        },
        'player': {
            'name': profile.display_name,
            'vehicle_name': equipped_uv.vehicle.name,
            'model_type': equipped_uv.vehicle.model_type,
            'top_speed': equipped_uv.effective_top_speed,
            'acceleration': equipped_uv.effective_acceleration,
            'handling': equipped_uv.effective_handling,
            'shield': equipped_uv.effective_shield,
            'boost': equipped_uv.effective_boost,
            'color': equipped_uv.color,
            'trail_color': equipped_uv.trail,
        },
        'sound_enabled': profile.sound_enabled,
        'music_enabled': profile.music_enabled,
    }

    context = {
        'track': track,
        'equipped_uv': equipped_uv,
        'difficulty': difficulty,
        'race_config_json': json.dumps(race_config),
    }
    return render(request, 'game/race_arena.html', context)


def hangar(request):
    """The Hangar: ship selection, upgrade garage, and custom paint shop."""
    profile = get_or_create_profile(request)
    vehicles = Vehicle.objects.all().order_by('price')
    user_vehicles_map = {uv.vehicle_id: uv for uv in profile.vehicles.all()}

    hangar_items = []
    for v in vehicles:
        uv = user_vehicles_map.get(v.id)
        is_owned = uv is not None
        is_equipped = profile.equipped_vehicle_id == v.id

        # Upgrade costs: base * (level + 1)
        speed_lvl = uv.speed_upgrade if uv else 0
        accel_lvl = uv.accel_upgrade if uv else 0
        handling_lvl = uv.handling_upgrade if uv else 0
        shield_lvl = uv.shield_upgrade if uv else 0
        boost_lvl = uv.boost_upgrade if uv else 0

        upgrade_costs = {
            'speed': 350 * (speed_lvl + 1) if speed_lvl < 5 else None,
            'accel': 300 * (accel_lvl + 1) if accel_lvl < 5 else None,
            'handling': 300 * (handling_lvl + 1) if handling_lvl < 5 else None,
            'shield': 250 * (shield_lvl + 1) if shield_lvl < 5 else None,
            'boost': 400 * (boost_lvl + 1) if boost_lvl < 5 else None,
        }

        hangar_items.append({
            'vehicle': v,
            'uv': uv,
            'is_owned': is_owned,
            'is_equipped': is_equipped,
            'effective_speed': uv.effective_top_speed if uv else v.base_top_speed,
            'effective_accel': uv.effective_acceleration if uv else v.base_acceleration,
            'effective_handling': uv.effective_handling if uv else v.base_handling,
            'effective_shield': uv.effective_shield if uv else v.base_shield,
            'effective_boost': uv.effective_boost if uv else v.base_boost,
            'upgrade_costs': upgrade_costs,
        })

    context = {
        'profile': profile,
        'hangar_items': hangar_items,
    }
    return render(request, 'game/hangar.html', context)


def leaderboards(request):
    """Global and track leaderboards with filters."""
    profile = get_or_create_profile(request)
    tracks = Track.objects.all().order_by('order')
    selected_slug = request.GET.get('track', tracks.first().slug if tracks.exists() else None)
    selected_mode = request.GET.get('mode', 'GRAND_PRIX')

    selected_track = None
    records = []
    if selected_slug:
        selected_track = Track.objects.filter(slug=selected_slug).first()
        if selected_track:
            records = RaceResult.objects.filter(
                track=selected_track,
                mode=selected_mode
            ).select_related('profile', 'vehicle').order_by('total_time_ms')[:50]

    context = {
        'profile': profile,
        'tracks': tracks,
        'selected_track': selected_track,
        'selected_mode': selected_mode,
        'records': records,
    }
    return render(request, 'game/leaderboard.html', context)


def profile_view(request):
    """Pilot dossier, race history, stats, and medals."""
    profile = get_or_create_profile(request)
    all_achievements = Achievement.objects.all()
    unlocked_ids = set(profile.achievements.values_list('achievement_id', flat=True))

    achievements_display = []
    for a in all_achievements:
        achievements_display.append({
            'item': a,
            'is_unlocked': a.id in unlocked_ids,
        })

    history = profile.race_results.select_related('track', 'vehicle').order_by('-created_at')[:20]

    total = profile.race_results.count()
    wins = profile.race_results.filter(position=1).count()
    podiums = profile.race_results.filter(position__lte=3).count()
    max_speed_rec = profile.race_results.order_by('-max_speed_kmh').first()
    max_speed = max_speed_rec.max_speed_kmh if max_speed_rec else 0.0

    context = {
        'profile': profile,
        'achievements_display': achievements_display,
        'history': history,
        'stats': {
            'total': total,
            'wins': wins,
            'podiums': podiums,
            'win_rate': round(wins / total * 100, 1) if total > 0 else 0,
            'max_speed': max_speed,
        }
    }
    return render(request, 'game/profile.html', context)


# ---------------- API ENDPOINTS ---------------- #

@require_POST
def api_race_finish(request):
    """Records race result, credits, XP, and tests for unlockable achievements."""
    try:
        data = json.loads(request.body)
        track_id = data.get('track_id')
        total_time_ms = int(data.get('total_time_ms', 0))
        best_lap_ms = int(data.get('best_lap_ms', 0))
        position = int(data.get('position', 1))
        max_speed = float(data.get('max_speed', 0.0))
        mode = data.get('mode', 'GRAND_PRIX')
        difficulty = data.get('difficulty', 'MEDIUM').upper()

        profile = get_or_create_profile(request)
        track = get_object_or_404(Track, id=track_id)
        equipped_uv = profile.get_equipped_user_vehicle()
        vehicle = equipped_uv.vehicle if equipped_uv else None

        # Sanity check total time (must be at least 15 seconds)
        if total_time_ms < 15000:
            return JsonResponse({'success': False, 'error': 'Invalid race time.'}, status=400)

        # Calculate rewards based on podium placement & difficulty multiplier
        diff_mult = 1.0
        if difficulty == 'HARD':
            diff_mult = 1.6
        elif difficulty == 'EASY':
            diff_mult = 0.85

        credits_awarded = 0
        xp_awarded = 0
        if position == 1:
            credits_awarded = int(track.first_place_reward * diff_mult)
            xp_awarded = int(track.xp_reward * diff_mult)
        elif position == 2:
            credits_awarded = int(track.second_place_reward * diff_mult)
            xp_awarded = int(track.xp_reward * 0.75 * diff_mult)
        elif position == 3:
            credits_awarded = int(track.third_place_reward * diff_mult)
            xp_awarded = int(track.xp_reward * 0.50 * diff_mult)
        else:
            credits_awarded = int(track.third_place_reward * 0.5 * diff_mult)
            xp_awarded = int(track.xp_reward * 0.3 * diff_mult)

        # Save Race Result
        result = RaceResult.objects.create(
            profile=profile,
            track=track,
            vehicle=vehicle,
            mode=mode,
            difficulty=difficulty,
            position=position,
            total_time_ms=total_time_ms,
            best_lap_ms=best_lap_ms,
            credits_earned=credits_awarded,
            xp_earned=xp_awarded,
            max_speed_kmh=max_speed,
        )

        old_level = profile.level
        profile.add_credits(credits_awarded)
        profile.add_xp(xp_awarded)
        level_up = profile.level > old_level

        # Evaluate Achievements
        unlocked_achievements = []

        def grant_achievement(slug):
            ach = Achievement.objects.filter(slug=slug).first()
            if ach:
                ua, created = UserAchievement.objects.get_or_create(profile=profile, achievement=ach)
                if created:
                    profile.add_credits(ach.reward_credits)
                    unlocked_achievements.append({
                        'title': ach.title,
                        'description': ach.description,
                        'reward': ach.reward_credits,
                    })

        # 1. First Win
        if position == 1:
            grant_achievement('first_win')

        # 2. Speed Demon (>300 km/h)
        if max_speed >= 300.0:
            grant_achievement('speed_demon')

        # 3. Abyss Champion
        if track.slug == 'singularity-abyss' and position == 1:
            grant_achievement('abyss_champion')

        # 4. Fleet Commander
        if profile.vehicles.count() >= 3:
            grant_achievement('fleet_commander')

        return JsonResponse({
            'success': True,
            'position': position,
            'credits_earned': credits_awarded,
            'xp_earned': xp_awarded,
            'new_credits': profile.credits,
            'new_level': profile.level,
            'level_up': level_up,
            'unlocked_achievements': unlocked_achievements,
            'formatted_time': result.total_time_formatted,
            'formatted_best_lap': result.best_lap_formatted,
        })

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_POST
def api_garage_buy(request):
    """Purchase a vehicle with cosmic credits."""
    try:
        data = json.loads(request.body)
        vehicle_id = data.get('vehicle_id')
        profile = get_or_create_profile(request)
        vehicle = get_object_or_404(Vehicle, id=vehicle_id)

        if profile.vehicles.filter(vehicle=vehicle).exists():
            return JsonResponse({'success': False, 'error': 'You already own this space racer.'})

        if profile.credits < vehicle.price:
            return JsonResponse({'success': False, 'error': f"Insufficient credits! Need {vehicle.price - profile.credits} more."})

        profile.credits -= vehicle.price
        profile.save(update_fields=['credits'])
        UserVehicle.objects.create(profile=profile, vehicle=vehicle)

        # Check Fleet Commander achievement
        if profile.vehicles.count() >= 3:
            ach = Achievement.objects.filter(slug='fleet_commander').first()
            if ach:
                UserAchievement.objects.get_or_create(profile=profile, achievement=ach)

        return JsonResponse({
            'success': True,
            'new_credits': profile.credits,
            'message': f"Acquired {vehicle.name}!"
        })

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_POST
def api_garage_equip(request):
    """Equip an owned vehicle for races."""
    try:
        data = json.loads(request.body)
        vehicle_id = data.get('vehicle_id')
        profile = get_or_create_profile(request)
        vehicle = get_object_or_404(Vehicle, id=vehicle_id)

        if not profile.vehicles.filter(vehicle=vehicle).exists():
            return JsonResponse({'success': False, 'error': 'You must unlock this racer before equipping it.'})

        profile.equipped_vehicle = vehicle
        profile.save(update_fields=['equipped_vehicle'])

        return JsonResponse({'success': True, 'message': f"Equipped {vehicle.name}."})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_POST
def api_garage_upgrade(request):
    """Upgrade a subsystem (speed, accel, handling, shield, boost)."""
    try:
        data = json.loads(request.body)
        vehicle_id = data.get('vehicle_id')
        stat_name = data.get('stat')  # 'speed', 'accel', 'handling', 'shield', 'boost'

        profile = get_or_create_profile(request)
        uv = get_object_or_404(UserVehicle, profile=profile, vehicle_id=vehicle_id)

        stat_field_map = {
            'speed': 'speed_upgrade',
            'accel': 'accel_upgrade',
            'handling': 'handling_upgrade',
            'shield': 'shield_upgrade',
            'boost': 'boost_upgrade',
        }

        cost_base_map = {
            'speed': 350,
            'accel': 300,
            'handling': 300,
            'shield': 250,
            'boost': 400,
        }

        if stat_name not in stat_field_map:
            return JsonResponse({'success': False, 'error': 'Unknown upgrade system.'})

        field = stat_field_map[stat_name]
        current_level = getattr(uv, field)

        if current_level >= 5:
            return JsonResponse({'success': False, 'error': 'Subsystem already at maximum capacity (Mk V)!'})

        cost = cost_base_map[stat_name] * (current_level + 1)
        if profile.credits < cost:
            return JsonResponse({'success': False, 'error': f"Insufficient credits! Need {cost - profile.credits} more."})

        # Deduct credits & upgrade
        profile.credits -= cost
        profile.save(update_fields=['credits'])
        setattr(uv, field, current_level + 1)
        uv.save()

        # Cosmic Engineer Achievement
        ach = Achievement.objects.filter(slug='cosmic_mechanic').first()
        if ach:
            UserAchievement.objects.get_or_create(profile=profile, achievement=ach)

        return JsonResponse({
            'success': True,
            'new_level': current_level + 1,
            'new_credits': profile.credits,
            'new_stat_value': getattr(uv, f"effective_{stat_name if stat_name != 'accel' else 'acceleration'}"),
            'next_cost': cost_base_map[stat_name] * (current_level + 2) if (current_level + 1) < 5 else None,
            'message': f"Upgraded {stat_name.title()} to Mk {current_level + 1}!"
        })

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_POST
def api_garage_customize(request):
    """Save custom paint color and neon trail for a ship."""
    try:
        data = json.loads(request.body)
        vehicle_id = data.get('vehicle_id')
        color = data.get('color')
        trail = data.get('trail')

        profile = get_or_create_profile(request)
        uv = get_object_or_404(UserVehicle, profile=profile, vehicle_id=vehicle_id)

        if color:
            uv.custom_color = color
        if trail:
            uv.custom_trail = trail
        uv.save()

        return JsonResponse({'success': True, 'message': 'Custom livery and trail updated!'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_POST
def api_update_settings(request):
    """Toggle audio / music settings."""
    try:
        data = json.loads(request.body)
        profile = get_or_create_profile(request)
        if 'sound_enabled' in data:
            profile.sound_enabled = bool(data['sound_enabled'])
        if 'music_enabled' in data:
            profile.music_enabled = bool(data['music_enabled'])
        if 'display_name' in data and data['display_name'].strip():
            profile.display_name = data['display_name'].strip()[:50]
        profile.save()

        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# ---------------- AUTHENTICATION ---------------- #

def pilot_register(request):
    """Register user account from guest or scratch."""
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        u_name = request.POST.get('username', '').strip()
        p_word = request.POST.get('password', '')
        callsign = request.POST.get('callsign', '').strip() or u_name

        if not u_name or not p_word:
            messages.error(request, "Username and password required.")
            return render(request, 'game/auth_register.html')

        if User.objects.filter(username=u_name).exists():
            messages.error(request, "Callsign already claimed in this sector.")
            return render(request, 'game/auth_register.html')

        user = User.objects.create_user(username=u_name, password=p_word)

        # Migrate guest profile if exists
        guest_id = request.session.get('guest_id')
        if guest_id:
            guest_prof = UserProfile.objects.filter(guest_id=guest_id).first()
            if guest_prof:
                guest_prof.user = user
                guest_prof.display_name = callsign
                guest_prof.guest_id = None
                guest_prof.save()
            else:
                UserProfile.objects.create(user=user, display_name=callsign)
        else:
            UserProfile.objects.create(user=user, display_name=callsign)

        login(request, user)
        messages.success(request, f"Welcome aboard Pilot {callsign}!")
        return redirect('home')

    return render(request, 'game/auth_register.html')


def pilot_login(request):
    """Login existing user account."""
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        u_name = request.POST.get('username', '').strip()
        p_word = request.POST.get('password', '')
        user = authenticate(request, username=u_name, password=p_word)

        if user is not None:
            login(request, user)
            messages.success(request, f"Pilot {user.username} verified!")
            return redirect('home')
        else:
            messages.error(request, "Invalid flight credentials.")

    return render(request, 'game/auth_login.html')


def pilot_logout(request):
    """Logout current user."""
    logout(request)
    messages.info(request, "Logged out. Switched to guest flight mode.")
    return redirect('home')


# ---------------- ARCADE GAMES PLATFORM ---------------- #

def arcade_hub(request):
    """Avi Games World: Arcade Hub showcasing all playable games."""
    profile = get_or_create_profile(request)
    games = ArcadeGame.objects.all().order_by('id')

    games_data = []
    for g in games:
        my_high_score = profile.arcade_scores.filter(game=g).order_by('-score').first()
        best_overall = g.scores.order_by('-score').select_related('profile').first()
        games_data.append({
            'game': g,
            'my_high_score': my_high_score,
            'best_overall': best_overall,
        })

    context = {
        'profile': profile,
        'games_data': games_data,
    }
    return render(request, 'game/arcade_hub.html', context)


@ensure_csrf_cookie
def arcade_gold_rush(request):
    """Super Cosmic Gold Rush (Mario-inspired platformer)."""
    profile = get_or_create_profile(request)
    game = get_object_or_404(ArcadeGame, slug='super-gold-rush')
    game.plays_count += 1
    game.save(update_fields=['plays_count'])

    top_scores = game.scores.select_related('profile').order_by('-score')[:10]
    my_best = profile.arcade_scores.filter(game=game).order_by('-score').first()

    context = {
        'profile': profile,
        'game': game,
        'top_scores': top_scores,
        'my_best': my_best,
    }
    return render(request, 'game/arcade_gold_rush.html', context)


@ensure_csrf_cookie
def arcade_quantum_puzzle(request):
    """Quantum Nova: Space Gem Match Puzzle."""
    profile = get_or_create_profile(request)
    game = get_object_or_404(ArcadeGame, slug='quantum-puzzle')
    game.plays_count += 1
    game.save(update_fields=['plays_count'])

    top_scores = game.scores.select_related('profile').order_by('-score')[:10]
    my_best = profile.arcade_scores.filter(game=game).order_by('-score').first()

    context = {
        'profile': profile,
        'game': game,
        'top_scores': top_scores,
        'my_best': my_best,
    }
    return render(request, 'game/arcade_puzzle.html', context)


@ensure_csrf_cookie
def arcade_void_invaders(request):
    """Cosmic Invaders: Void Defense retro space shooter."""
    profile = get_or_create_profile(request)
    game = get_object_or_404(ArcadeGame, slug='void-invaders')
    game.plays_count += 1
    game.save(update_fields=['plays_count'])

    top_scores = game.scores.select_related('profile').order_by('-score')[:10]
    my_best = profile.arcade_scores.filter(game=game).order_by('-score').first()

    context = {
        'profile': profile,
        'game': game,
        'top_scores': top_scores,
        'my_best': my_best,
    }
    return render(request, 'game/arcade_invaders.html', context)


@require_POST
def api_arcade_score(request):
    """Submit score for any arcade game and claim CC + XP rewards."""
    try:
        data = json.loads(request.body)
        game_slug = data.get('game_slug')
        score = int(data.get('score', 0))

        if score < 0:
            return JsonResponse({'success': False, 'error': 'Invalid score.'}, status=400)

        profile = get_or_create_profile(request)
        game = get_object_or_404(ArcadeGame, slug=game_slug)

        # Calculate reward: score / 10 * multiplier
        credits_earned = max(10, int((score / 8) * game.credit_multiplier))
        xp_earned = max(15, int((score / 15) * game.credit_multiplier))

        score_rec = ArcadeScore.objects.create(
            profile=profile,
            game=game,
            score=score,
            credits_earned=credits_earned,
            xp_earned=xp_earned
        )

        old_level = profile.level
        profile.add_credits(credits_earned)
        profile.add_xp(xp_earned)

        return JsonResponse({
            'success': True,
            'score': score,
            'credits_earned': credits_earned,
            'xp_earned': xp_earned,
            'new_credits': profile.credits,
            'new_level': profile.level,
            'level_up': profile.level > old_level,
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

