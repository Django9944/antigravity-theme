#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
echo "============================================"
echo "  Antigravity Theme - macOS 卸载程序"
echo "============================================"
bash "./install.sh" --uninstall "$@"
EXIT_CODE=$?
echo ""
read -r -p "按回车键关闭窗口..." _ || true
exit $EXIT_CODE
