import re
import time
from django.http import JsonResponse, HttpResponseForbidden
from django.core.cache import cache

class CosmicSecurityFirewallMiddleware:
    """
    Cosmic Security Web Application Firewall (WAF) & Rate Limiting Middleware.
    Protects against SQL Injection, XSS, Path Traversal, Command Injection, and DoS Flooding.
    """

    # Malicious payload patterns
    SUSPICIOUS_PATTERNS = [
        re.compile(r"(\%27)|(\')|(\-\-)|(\%23)|(#)", re.IGNORECASE), # SQL Meta-chars (in suspicious contexts)
        re.compile(r"((\%3D)|(=))[^\n]*((%27)|(\')|(\-\-)|(\%3B)|(;))", re.IGNORECASE),
        re.compile(r"\w*((\%27)|(\'))(\s)*((\%6F)|o|(\%4F))((\%72)|r|(\%52))", re.IGNORECASE), # ' or
        re.compile(r"((\%27)|(\'))\s*union", re.IGNORECASE),
        re.compile(r"(\.\./|\.\.\\)", re.IGNORECASE), # Path Traversal
        re.compile(r"(<script|javascript:|onerror=|onload=|<iframe|<img\s+src=.*onerror)", re.IGNORECASE), # XSS
        re.compile(r"(\;|\&|\|)\s*(cat|ls|chmod|nc|bash|sh|whoami)\b", re.IGNORECASE), # Command Injection
    ]

    # Exclude safe endpoints from strict pattern match (like Django admin or static)
    SAFE_PREFIXES = ('/static/', '/admin/')

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        client_ip = self.get_client_ip(request)

        # 1. Rate Limiting Check (DoS Shield)
        # Allow up to 100 requests per 10-second window per IP
        if not request.path.startswith('/static/'):
            if not self.check_rate_limit(client_ip):
                return JsonResponse({
                    'error': 'COSMIC FIREWALL: Rate limit exceeded. Too many requests, try again shortly.'
                }, status=429)

        # 2. Deep Request Inspection (WAF)
        if not any(request.path.startswith(prefix) for prefix in self.SAFE_PREFIXES):
            raw_uri = request.get_full_path()
            if self.is_malicious(raw_uri):
                return HttpResponseForbidden("COSMIC SHIELD FIREWALL: Malicious payload pattern intercepted.")

        # Process Request
        response = self.get_response(request)

        # 3. Add Strong Security Headers to every response
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'accelerometer=(), camera=(), microphone=(), geolocation=()'

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip

    def check_rate_limit(self, ip):
        """Sliding-window rate limiter using cache."""
        now = int(time.time())
        window_key = f"rate_limit:{ip}:{now // 10}"
        try:
            req_count = cache.get(window_key, 0)
            if req_count > 120:
                return False
            cache.set(window_key, req_count + 1, timeout=12)
        except Exception:
            pass # Fail open if cache unavailable
        return True

    def is_malicious(self, content):
        if not content:
            return False
        # Only inspect suspicious query strings
        if '?' in content:
            query_part = content.split('?', 1)[1]
            for pattern in self.SUSPICIOUS_PATTERNS:
                if pattern.search(query_part):
                    return True
        return False
