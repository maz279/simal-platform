#!/usr/bin/env bash
# ==============================================================================
# deploy-kyc-patch.sh — Production Hotfix Deployer for https://kyc.simalme.com
# Targets: Node.js KYC_System backend on 182.160.112.72
# ==============================================================================
set -euo pipefail

TARGET_PATH="${1:-}"

if [ -n "$TARGET_PATH" ] && [ -d "$TARGET_PATH" ]; then
  APP_DIR="$TARGET_PATH"
else
  APP_DIR=""
  for candidate in \
    "/var/www/simal_kyc/KYC_System" \
    "/var/www/kyc/KYC_System" \
    "/var/www/KYC_System" \
    "/opt/simal_kyc/KYC_System" \
    "/home/kyc/simal_kyc/KYC_System" \
    "/root/simal_kyc/KYC_System" \
    "$(pwd)"; do
    if [ -f "$candidate/package.json" ] && grep -q "simal-kyc" "$candidate/package.json" 2>/dev/null; then
      APP_DIR="$candidate"
      break
    fi
  done
fi

if [ -z "$APP_DIR" ]; then
  echo "[-] Error: Could not automatically detect simal-kyc-system directory."
  echo "    Usage: ./deploy-kyc-patch.sh /path/to/KYC_System"
  exit 1
fi

echo "[+] Target KYC application directory: $APP_DIR"
cd "$APP_DIR"

# Backup
BACKUP_DIR="$APP_DIR/backup_$(date +%Y%m%d_%H%M%S)"
echo "[+] Creating backup at $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r public "$BACKUP_DIR/" 2>/dev/null || true
cp -r src/services/routes.js "$BACKUP_DIR/" 2>/dev/null || true

# Extract
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATCH_ZIP="$SCRIPT_DIR/simal-kyc-login-patch.zip"

if [ -f "$PATCH_ZIP" ]; then
  echo "[+] Extracting $PATCH_ZIP..."
  unzip -o "$PATCH_ZIP" -d "$APP_DIR"
elif [ -f "simal-kyc-login-patch.zip" ]; then
  echo "[+] Extracting local simal-kyc-login-patch.zip..."
  unzip -o "simal-kyc-login-patch.zip" -d "$APP_DIR"
else
  echo "[-] Error: simal-kyc-login-patch.zip not found in $SCRIPT_DIR or $APP_DIR"
  exit 1
fi

# Permissions
echo "[+] Setting permissions..."
chmod -R 755 public
chmod 644 src/services/routes.js

# Restart process
echo "[+] Restarting service..."
if command -v pm2 &> /dev/null; then
  pm2 reload all || pm2 restart all || true
fi
if systemctl is-active --quiet kyc 2>/dev/null; then
  systemctl restart kyc
elif systemctl is-active --quiet simal-kyc 2>/dev/null; then
  systemctl restart simal-kyc
elif systemctl is-active --quiet simal 2>/dev/null; then
  systemctl restart simal
fi

# Verify
echo "[+] Verifying deployment..."
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" https://kyc.simalme.com/login.html || true)
echo "[+] Status for https://kyc.simalme.com/login.html: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "[SUCCESS] KYC Login is live at https://kyc.simalme.com/login.html!"
else
  LOCAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/login.html 2>/dev/null || true)
  echo "[+] Local test (127.0.0.1:3000/login.html): $LOCAL_CODE"
fi
