from django.test import TestCase, Client
from django.urls import reverse
from game.models import UserProfile, Vehicle, Track, RaceResult, UserVehicle
import json

class SpaceRacingTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.vehicle = Vehicle.objects.create(
            slug='test-speeder',
            name='Test Speeder',
            price=0,
            base_top_speed=250.0,
            base_acceleration=7.0,
            base_handling=7.0,
            base_shield=100.0,
            base_boost=100.0
        )
        self.track = Track.objects.create(
            slug='test-orbit',
            name='Test Orbit',
            difficulty='EASY',
            theme='earth_orbit',
            laps=3,
            length_km=3.0,
            first_place_reward=1000,
            second_place_reward=600,
            third_place_reward=350,
            xp_reward=300
        )

    def test_pages_load(self):
        # 1. Home
        res = self.client.get(reverse('home'))
        self.assertEqual(res.status_code, 200)

        # 2. Tracks
        res = self.client.get(reverse('tracks_list'))
        self.assertEqual(res.status_code, 200)

        # 3. Hangar
        res = self.client.get(reverse('hangar'))
        self.assertEqual(res.status_code, 200)

        # 4. Leaderboard
        res = self.client.get(reverse('leaderboards'))
        self.assertEqual(res.status_code, 200)

        # 5. Race Arena
        res = self.client.get(reverse('race_arena', kwargs={'slug': self.track.slug}))
        self.assertEqual(res.status_code, 200)

    def test_api_race_finish(self):
        payload = {
            'track_id': self.track.id,
            'total_time_ms': 65000,
            'best_lap_ms': 21000,
            'position': 1,
            'max_speed': 310.0,
            'mode': 'GRAND_PRIX'
        }
        res = self.client.post(
            reverse('api_race_finish'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['position'], 1)
        self.assertEqual(data['credits_earned'], 1000)

    def test_firewall_blocks_sql_injection(self):
        # Malicious SQL pattern in query string
        res = self.client.get("/?track=' OR '1'='1")
        self.assertEqual(res.status_code, 403)

    def test_firewall_security_headers(self):
        res = self.client.get(reverse('home'))
        self.assertEqual(res.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(res.headers.get('X-Frame-Options'), 'DENY')
