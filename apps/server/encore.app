{
  "id": "server-nest-8sci",
  "lang": "typescript",
  "build": {
    "docker": {
      "bundle_source": false,
      "base_image": "node:22"
    }
  },
  "global_cors": {
    "allow_origins_with_credentials": [
      "https://ims.reserhub.com",
      "https://ims-sbx.resertravel.com"
    ],
    "allow_origins_without_credentials": [
      "https://ims.reserhub.com",
      "https://ims-sbx.resertravel.com"
    ],
    "allow_headers": ["*"],
    "expose_headers": ["*"]
  }
}
