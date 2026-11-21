#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
echo "============================================"
echo "  Antigravity Theme - 检查更新"
echo "============================================"
bash "./install.sh" --check-update "$@"
EXIT_CODE=$?
echo ""
read -r -p "按回车键关闭窗口..." _ || true
exit $EXIT_CODE
