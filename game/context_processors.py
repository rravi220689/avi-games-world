import uuid
from .models import UserProfile, Vehicle, UserVehicle

def get_or_create_profile(request):
    """Retrieve or create user profile for authenticated user or guest session."""
    if request.user.is_authenticated:
        profile, created = UserProfile.objects.get_or_create(
            user=request.user,
            defaults={'display_name': request.user.username}
        )
    else:
        guest_id = request.session.get('guest_id')
        if not guest_id:
            guest_id = f"cadet_{uuid.uuid4().hex[:8]}"
            request.session['guest_id'] = guest_id

        profile, created = UserProfile.objects.get_or_create(
            guest_id=guest_id,
            defaults={'display_name': f"Pilot {guest_id[-4:].upper()}"}
        )

    # Ensure player has at least one starting vehicle
    if not profile.vehicles.exists():
        starter_vehicle = Vehicle.objects.filter(price=0).first()
        if not starter_vehicle:
            starter_vehicle = Vehicle.objects.first()
        if starter_vehicle:
            UserVehicle.objects.create(profile=profile, vehicle=starter_vehicle)
            profile.equipped_vehicle = starter_vehicle
            profile.save(update_fields=['equipped_vehicle'])

    return profile

def player_profile(request):
    """Context processor exposing current player profile to templates."""
    try:
        profile = get_or_create_profile(request)
        equipped_uv = profile.get_equipped_user_vehicle()
        return {
            'player_profile': profile,
            'equipped_vehicle': equipped_uv,
        }
    except Exception:
        return {
            'player_profile': None,
            'equipped_vehicle': None,
        }
