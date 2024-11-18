# 產生 CA 私鑰 (ca.key)
openssl genrsa -out ca.key 4096


# 使用私鑰產生自簽名根憑證 (ca.crt)
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt \
  -subj "/C=TW/ST=Taiwan/L=Taipei/O=thingnario/CN=Internal CA"


# 產生網站私鑰 (taipower-com.key)
openssl genrsa -out taipower-com.key 4096

# 產生 CSR (taipower-com.csr)，此步驟會要求輸入一些資訊
openssl req -new -key taipower-com.key -out taipower-com.csr \
  -subj "/C=TW/ST=Taiwan/L=Taipei/O=thingnario/CN=*.taipower.com"

# 使用 CA 憑證簽發網站的 Wildcard 憑證 (taipower-com.crt)
openssl x509 -req -in taipower-com.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out taipower-com.crt -days 3650 -sha256 -extfile v3.ext
