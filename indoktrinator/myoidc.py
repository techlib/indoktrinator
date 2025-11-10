from secrets import token_urlsafe

from flask import request, session, redirect, make_response, url_for, abort
from werkzeug.exceptions import Forbidden
from authlib.integrations.flask_client import OAuth


class OIDCAuth:
    def __init__(self, config):
        self.attr_map = {}

        if 'attr_map' in config:
            self.attr_map = config['attr_map']
            del config['attr_map']

        self.client = {}

    def translate_attributes(self, attr):
        res = {}
        for k, v in attr.items():
            if k in self.attr_map:
                res[self.attr_map[k]] = v
            else:
                res[k] = v
        return res


def setup_app_auth(flask_app, config):
    auth_app = OAuth(flask_app)

    print(config)
    idp = auth_app.register(
        name='idp',
        client_id=config['client_id'],
        client_secret=config['client_secret'],
        server_metadata_url=config['metadata_url'],
        client_kwargs={
            'scope': 'openid email profile',
        })

    @flask_app.before_request
    def verify_auth():
        if 'static' in request.path:
            return
        if '/login' in request.path:
            return
        if '/auth/callback' in request.path:
            return
        if '/healthz' in request.path:
            return
        if '/monitoring/' in request.path:
            return
        if 'user' in session:
            return

        redirect_uri = url_for('oidc_login', _external=True)
        return redirect(redirect_uri)

    @flask_app.route('/login')
    def oidc_login():
        redirect_uri = url_for('oidc_receive', _external=True)
        nonce = token_urlsafe(32)
        session['oidc_nonce'] = nonce
        return idp.authorize_redirect(redirect_uri, code_challenge_method='S256', nonce=nonce)

    @flask_app.route('/auth/callback', methods=['GET'])
    def oidc_receive():
        # If the provider returned an OAuth error, bubble it up:
        if 'error' in request.args:
            return abort(400, f'OIDC error: {request.args.get('error_description') or request.args['error']}')

        # Exchange code for tokens (Authlib verifies state, uses saved PKCE verifier, etc.)
        token = idp.authorize_access_token()  # dict with access_token, id_token, expires_in, etc.
        # Validate & parse the ID Token (signature + iss/aud/nonce claims)
        # This will use provider’s JWKS and the nonce saved during authorize_redirect.

        nonce = session.pop('oidc_nonce', None)
        id_claims = idp.parse_id_token(token, nonce=nonce)  # dict with the claims in the ID Token

        # Optionally call userinfo (nice for normalized profile)
        userinfo = {}
        try:
            userinfo = idp.userinfo(token=token)  # GET to userinfo_endpoint with the access token
        except Exception:
            # Some providers may not expose userinfo; fall back to claims.
            pass

        # ---- YOU: save to your session however you want (no decorators involved) ----
        # Keep it minimal; only store what you need.
        # You can omit tokens or store them encrypted/elsewhere if you prefer.

        session['user'] = {
            'id': userinfo.get('sub'),
            'email': userinfo.get('email'),
            'name': userinfo.get('name'),
            'roles': userinfo.get('ntk_roles', []),
            'status': userinfo.get('ntk_status'),
            'ntk_email': userinfo.get('ntk_email'),
            'category': userinfo.get('ntk_category'),
            'personal_number': userinfo.get('ntk_personal_number'),
            'expires': userinfo.get('ntk_expires'),
            'preferred_username': userinfo.get('preferred_username'),
            'given_name': userinfo.get('given_name'),
            'family_name': userinfo.get('family_name'),
            'username': userinfo.get('username'),
            'account_id': userinfo.get('account_id'),
        }
        try:
            return redirect(url_for('home'))
        except:
            return redirect(url_for('index'))
