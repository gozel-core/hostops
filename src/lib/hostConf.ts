export function getHostConf(opts: GetHostConfOpts) {
    if (opts.template === "standardStatic") {
        return `
# redirect http traffic to https for the host
server {
  listen 0.0.0.0:80;
  listen [::]:80;
  server_name ${opts.serverName};
  server_tokens off;
  return 301 https://$http_host$request_uri;
}

# https host
server {
  listen 0.0.0.0:443 ssl;
  listen [::]:443 ssl;
  http2 on;
  server_name ${opts.serverName};
  server_tokens off;
  
  # stronger ssl security
  # ref 1: https://raymii.org/s/tutorials/Strong_SSL_Security_On_nginx.html
  # ref 2: https://ssl-config.mozilla.org/#server=nginx&version=1.17.7&config=intermediate&openssl=1.1.1k&guideline=5.7
  ssl_certificate ${opts.sslCert};
  ssl_certificate_key ${opts.sslCertKey};
  ssl_session_timeout 1d;
  ssl_session_cache shared:SSL:10m;
  ssl_session_tickets off;
  ssl_dhparam /etc/ssl/certs/dhparam.pem;
  ssl_ecdh_curve secp384r1;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:ECDHE-RSA-AES128-GCM-SHA256:AES256+EECDH:DHE-RSA-AES128-GCM-SHA256:AES256+EDH:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA:ECDHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES256-GCM-SHA384:AES128-GCM-SHA256:AES256-SHA256:AES128-SHA256:AES256-SHA:AES128-SHA:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4";
  ssl_prefer_server_ciphers on;
  
  add_header Strict-Transport-Security "max-age=63072000" always;
  add_header X-UA-Compatible "IE=Edge";
  add_header X-XSS-Protection "1; mode=block";
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options deny;
  add_header Referrer-Policy strict-origin-when-cross-origin;
  
  error_page 404 @error404;

  location / {
    root ${opts.locationRoot};

    add_header Cache-Control "no-cache, private, no-store, must-revalidate";
    expires off;
    etag off;

    try_files $uri $uri/index.html =404;
  }

  location @error404 {
    root ${opts.locationRoot};
    try_files /index.html =404;
  }
  
  # immutable caching for static assets with hash: /media/path/to/my-image.as76as67sa67.jpeg
  location ~* "/media/(.*)?([a-zA-Z0-9-]+).([a-z0-9]{6,32})(@2x|@3x|@4x)?.([a-zA-Z0-9]{2,4})$" {
    root ${opts.locationRoot};

    add_header Cache-Control "public, immutable";
    etag off;
    expires max;

    try_files $uri =404;
  }
  
  # etag caching for static assets: /media/path/to/my-image.jpeg
  location ~* "/media/(.*).([a-zA-Z0-9]{2,4})$" {
    root ${opts.locationRoot};

    try_files $uri =404;
  }
}
`;
    }

    if (opts.template === "standardProxy") {
        return `
# redirect http traffic to https for the host
server {
  listen 0.0.0.0:80;
  listen [::]:80;
  server_name ${opts.serverName};
  server_tokens off;
  return 301 https://$http_host$request_uri;
}

# https host
server {
  listen 0.0.0.0:443 ssl;
  listen [::]:443 ssl;
  http2 on;
  server_name ${opts.serverName};
  server_tokens off;
  
  # stronger ssl security
  # ref 1: https://raymii.org/s/tutorials/Strong_SSL_Security_On_nginx.html
  # ref 2: https://ssl-config.mozilla.org/#server=nginx&version=1.17.7&config=intermediate&openssl=1.1.1k&guideline=5.7
  ssl_certificate ${opts.sslCert};
  ssl_certificate_key ${opts.sslCertKey};
  ssl_session_timeout 1d;
  ssl_session_cache shared:SSL:10m;
  ssl_session_tickets off;
  ssl_dhparam /etc/ssl/certs/dhparam.pem;
  ssl_ecdh_curve secp384r1;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:ECDHE-RSA-AES128-GCM-SHA256:AES256+EECDH:DHE-RSA-AES128-GCM-SHA256:AES256+EDH:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA:ECDHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES256-GCM-SHA384:AES128-GCM-SHA256:AES256-SHA256:AES128-SHA256:AES256-SHA:AES128-SHA:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4";
  ssl_prefer_server_ciphers on;
  
  add_header Strict-Transport-Security "max-age=63072000" always;
  add_header X-UA-Compatible "IE=Edge";
  add_header X-XSS-Protection "1; mode=block";
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options deny;
  add_header Referrer-Policy strict-origin-when-cross-origin;
  
  location / {
    limit_req zone=one burst=5 delay=1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_pass ${opts.proxyPass};
  }
}
`;
    }

    return "";
}

export type GetHostConfOpts = GetHostConfStaticOpts | GetHostConfProxyOpts;

interface GetHostConfCommonOpts {
    serverName: string;
    sslCert: string;
    sslCertKey: string;
}

type GetHostConfStaticOpts = GetHostConfCommonOpts & {
    template: "standardStatic";
    locationRoot: string;
};

type GetHostConfProxyOpts = GetHostConfCommonOpts & {
    template: "standardProxy";
    proxyPass: string;
};
