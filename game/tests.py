from django.test import TestCase, Client
from django.urls import reverse
from game.models import (
    UserProfile, Vehicle, Track, RaceResult, UserVehicle,
    ArcadeGame, ArcadeScore, ContactMessage, ChatInteraction
)
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
        self.arcade_gold = ArcadeGame.objects.create(
            slug='super-gold-rush',
            title='Super Cosmic Gold Rush',
            tagline='Jump & smash blocks',
            description='Mario style cosmic coin collection',
            credit_multiplier=1.2,
            category='platformer'
        )
        self.arcade_puzzle = ArcadeGame.objects.create(
            slug='quantum-puzzle',
            title='Quantum Nova: Gem Match',
            tagline='Gem match-3 puzzle',
            description='Match quantum plasma gems',
            credit_multiplier=1.5,
            category='puzzle'
        )
        self.arcade_invaders = ArcadeGame.objects.create(
            slug='void-invaders',
            title='Cosmic Invaders: Void Defense',
            tagline='Retro alien space shooter',
            description='Defend against alien swarmers',
            credit_multiplier=1.4,
            category='shooter'
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

        # 6. Arcade Hub & Games
        self.assertEqual(self.client.get(reverse('arcade_hub')).status_code, 200)
        self.assertEqual(self.client.get(reverse('arcade_gold_rush')).status_code, 200)
        self.assertEqual(self.client.get(reverse('arcade_quantum_puzzle')).status_code, 200)
        self.assertEqual(self.client.get(reverse('arcade_void_invaders')).status_code, 200)

    def test_api_race_finish(self):
        payload = {
            'track_id': self.track.id,
            'total_time_ms': 65000,
            'best_lap_ms': 21000,
            'position': 1,
            'max_speed': 310.0,
            'mode': 'GRAND_PRIX',
            'difficulty': 'HARD'
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
        # 1000 * 1.6 = 1600
        self.assertEqual(data['credits_earned'], 1600)

    def test_api_arcade_score(self):
        payload = {
            'game_slug': 'super-gold-rush',
            'score': 800
        }
        res = self.client.post(
            reverse('api_arcade_score'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertGreater(data['credits_earned'], 0)
        self.assertGreater(data['xp_earned'], 0)
        self.assertEqual(data['score'], 800)

    def test_firewall_blocks_sql_injection(self):
        # Malicious SQL pattern in query string
        res = self.client.get("/?track=' OR '1'='1")
        self.assertEqual(res.status_code, 403)

    def test_firewall_security_headers(self):
        res = self.client.get(reverse('home'))
        self.assertEqual(res.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(res.headers.get('X-Frame-Options'), 'DENY')

    def test_contact_page_and_form_submission(self):
        # 1. GET page
        res = self.client.get(reverse('contact'))
        self.assertEqual(res.status_code, 200)

        # 2. POST suggestion
        res = self.client.post(reverse('contact'), {
            'name': 'Pilot Alpha',
            'email': 'alpha@galaxy.net',
            'category': 'suggestion',
            'subject': 'Add Neon Moon Circuit',
            'message': 'Please create a lunar track with low gravity loops!'
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(ContactMessage.objects.filter(subject='Add Neon Moon Circuit').exists())
        saved_msg = ContactMessage.objects.get(subject='Add Neon Moon Circuit')
        self.assertEqual(saved_msg.name, 'Pilot Alpha')
        self.assertEqual(saved_msg.category, 'suggestion')

    def test_chatbot_answering_and_database_persistence(self):
        # 1. Ask site question about controls
        payload = {
            'message': 'How do I steer and use nitro in 3D racing?',
            'session_id': 'test_session_123'
        }
        res = self.client.post(
            reverse('api_chatbot_message'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['success'])
        self.assertIn('3D Space Car Racing Controls', data['reply'])
        self.assertEqual(data['intent'], 'controls_racing')

        # Verify chat logged in database
        self.assertTrue(ChatInteraction.objects.filter(session_id='test_session_123').exists())

        # 2. Send suggestion via chatbot
        suggestion_payload = {
            'message': 'My suggestion is to add custom neon horns and engine rev sounds',
            'session_id': 'test_session_123'
        }
        res2 = self.client.post(
            reverse('api_chatbot_message'),
            data=json.dumps(suggestion_payload),
            content_type='application/json'
        )
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertTrue(data2['success'])
        self.assertTrue(data2['suggestion_saved'])

        # Verify suggestion row exists in ContactMessage table
        self.assertIsNotNone(data2['suggestion_id'])
        contact_row = ContactMessage.objects.get(id=data2['suggestion_id'])
        self.assertIn('custom neon horns', contact_row.message)
        self.assertEqual(contact_row.source, 'chatbot')

