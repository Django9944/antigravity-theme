#!/usr/bin/env bash
# =====================================================================
#  Antigravity Theme - macOS One-Click Installer & Manager
#  Copyright (c) 2026 Django9944, licensed under the MIT License.
#  功能:
#    1) 自动定位 Antigravity.app (/Applications, ~/Applications, Spotlight)
#    2) 原厂备份与逆向剥离自愈 (~/Library/Application Support/Antigravity/custom-theme-backup/app.asar.stock)
#    3) 调用跨平台共享引擎 core/asar-patcher.js (复用内置 ELECTRON_RUN_AS_NODE=1，Python 3 读取 manifest.json 兜底)
#    4) 保持 Contents/Info.plist 与 _CodeSignature 原始签名不动，不破坏 macOS TCC 权限
#    5) 双目录分发主题文件 (Contents/Resources/custom-theme 与 ~/Library/Application Support/Antigravity/custom-theme)
#
#  用法:
#    ./install.sh [--install] [--uninstall] [--check-update] [--update] [--doctor] [--enable-auto-heal] [--disable-auto-heal] [--app-path <path>] [--non-interactive|-y]
# =====================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST_PATH="${SCRIPT_DIR}/manifest.json"
PATCHER_SCRIPT="${SCRIPT_DIR}/core/asar-patcher.js"
UPDATER_SCRIPT="${SCRIPT_DIR}/core/updater.js"
LAUNCH_AGENT_LABEL="com.django9944.antigravity-theme.autoheal"
LEGACY_LAUNCH_AGENT_LABEL="com.django9944.antigravity-custom-themes.autoheal"

read_manifest_field() {
    local key="$1"
    local fallback="$2"
    if [ -f "$MANIFEST_PATH" ]; then
        local val
        val="$(grep -m1 "\"${key}\"[[:space:]]*:" "$MANIFEST_PATH" | sed -E "s/.*\"${key}\"[[:space:]]*:[[:space:]]*\"([^\"]+)\".*/\1/" || true)"
        if [ -n "$val" ]; then
            echo "$val"
            return 0
        fi
    fi
    echo "$fallback"
}

CURRENT_VERSION="$(read_manifest_field "version" "v0.2.0")"
REPO="$(read_manifest_field "repo" "Django9944/antigravity-theme")"
PAYLOAD_DIR="$(read_manifest_field "payloadDir" "dist/runtime")"
RELEASES_URL="https://github.com/${REPO}/releases/latest"
PAYLOADS=("current.css" "current.js")

MODE="install"
CUSTOM_APP_PATH=""
NON_INTERACTIVE=0

# ---------- 颜色与输出辅助 ----------
if [ -t 1 ]; then
    C_RED='\033[0;31m'
    C_GREEN='\033[0;32m'
    C_YELLOW='\033[0;33m'
    C_CYAN='\033[0;36m'
    C_GRAY='\033[0;90m'
    C_RESET='\033[0m'
else
    C_RED=''
    C_GREEN=''
    C_YELLOW=''
    C_CYAN=''
    C_GRAY=''
    C_RESET=''
fi

info() { printf "${C_CYAN}[*] %s${C_RESET}\n" "$*"; }
ok()   { printf "${C_GREEN}[OK] %s${C_RESET}\n" "$*"; }
warn() { printf "${C_YELLOW}[!] %s${C_RESET}\n" "$*"; }
die()  { printf "${C_RED}[X] %s${C_RESET}\n" "$*" >&2; exit 1; }

resolve_payload_file() {
    local fname="$1"
    local candidates=(
        "${SCRIPT_DIR}/${PAYLOAD_DIR}/${fname}"
        "${SCRIPT_DIR}/dist/runtime/${fname}"
        "${SCRIPT_DIR}/${fname}"
    )
    for p in "${candidates[@]}"; do
        if [ -f "$p" ]; then
            echo "$p"
            return 0
        fi
    done
    return 1
}

usage() {
    cat <<EOF
用法: $(basename "$0") [选项]

选项:
  --install              安装或修复 Antigravity 主题补丁 (默认)
  --uninstall, -u        卸载主题补丁并还原原厂 app.asar
  --check-update         检查 GitHub 最新发行版 (${REPO})，支持一键在线更新
  --update               自动下载校验最新 Release 并智能热更新/重注入
  --doctor               只读诊断当前 Antigravity 的 app.asar 兼容性与注入状态
  --enable-auto-heal     启用 macOS LaunchAgent 监听 app.asar，宿主升级后自动恢复主题
  --disable-auto-heal    停用并移除宿主升级自动恢复监听
  --auto-heal            静默执行一次宿主升级检测与自愈重注入 (供 LaunchAgent 调用)
  --app-path <path>      指定 Antigravity.app 路径 (默认自动探测)
  --non-interactive, -y  非交互静默模式 (跳过确认、不关闭或重启正在运行的客户端)
  --help, -h             显示帮助信息
EOF
}

# ---------- 参数解析 ----------
while [ $# -gt 0 ]; do
    case "$1" in
        --install)
            MODE="install"
            shift
            ;;
        --uninstall|-u|-Uninstall)
            MODE="uninstall"
            shift
            ;;
        --check-update|-CheckUpdate)
            MODE="check-update"
            shift
            ;;
        --update|-Update)
            MODE="update"
            shift
            ;;
        --doctor|-Doctor)
            MODE="doctor"
            shift
            ;;
        --enable-auto-heal|-EnableAutoHeal)
            MODE="enable-auto-heal"
            shift
            ;;
        --disable-auto-heal|-DisableAutoHeal)
            MODE="disable-auto-heal"
            shift
            ;;
        --auto-heal|-AutoHeal)
            MODE="auto-heal"
            NON_INTERACTIVE=1
            shift
            ;;
        --app-path)
            [ $# -ge 2 ] || die "--app-path 需要指定路径参数"
            CUSTOM_APP_PATH="$2"
            shift 2
            ;;
        --app-path=*)
            CUSTOM_APP_PATH="${1#*=}"
            shift
            ;;
        --non-interactive|-y)
            NON_INTERACTIVE=1
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            die "未知参数: $1 (使用 --help 查看用法)"
            ;;
    esac
done

# ---------- 解析真实用户 HOME 目录 (兼容 sudo 提权场景) ----------
resolve_user_home() {
    if [ -n "${SUDO_USER:-}" ] && [ "${SUDO_USER}" != "root" ]; then
        local shome
        shome="$(dscl . -read "/Users/${SUDO_USER}" NFSHomeDirectory 2>/dev/null | awk '{print $2}' || true)"
        if [ -n "$shome" ] && [ -d "$shome" ]; then
            echo "$shome"
            return
        fi
    fi
    echo "${HOME}"
}

USER_HOME="$(resolve_user_home)"
USER_DATA_DIR="${AG_USER_DATA_DIR:-${USER_HOME}/Library/Application Support/Antigravity}"
BACKUP_DIR="${AG_BACKUP_DIR:-${USER_DATA_DIR}/custom-theme-backup}"
BACKUP_PATH="${BACKUP_DIR}/app.asar.stock"

fix_user_ownership() {
    local target="$1"
    if [ -n "${SUDO_USER:-}" ] && [ "${SUDO_USER}" != "root" ] && [ -e "$target" ]; then
        chown -R "${SUDO_USER}" "$target" 2>/dev/null || true
    fi
}

cleanup_legacy_launch_agent() {
    local legacy_plist="${USER_HOME}/Library/LaunchAgents/${LEGACY_LAUNCH_AGENT_LABEL}.plist"
    if [ -f "$legacy_plist" ]; then
        launchctl unload "$legacy_plist" >/dev/null 2>&1 || true
        rm -f "$legacy_plist"
        return 0
    fi
    return 1
}

write_launch_agent_plist() {
    local launch_dir="${USER_HOME}/Library/LaunchAgents"
    local plist_file="${launch_dir}/${LAUNCH_AGENT_LABEL}.plist"
    local log_file="${USER_DATA_DIR}/custom-theme-autoheal.log"
    mkdir -p "$launch_dir" "$USER_DATA_DIR"
    cat > "$plist_file" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${LAUNCH_AGENT_LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${SCRIPT_DIR}/install.sh</string>
        <string>--auto-heal</string>
        <string>--app-path</string>
        <string>${APP_PATH}</string>
    </array>
    <key>WatchPaths</key>
    <array>
        <string>${ASAR_PATH}</string>
    </array>
    <key>ThrottleInterval</key>
    <integer>10</integer>
    <key>StandardOutPath</key>
    <string>${log_file}</string>
    <key>StandardErrorPath</key>
    <string>${log_file}</string>
</dict>
</plist>
PLIST_EOF
    fix_user_ownership "$plist_file"
    launchctl unload "$plist_file" >/dev/null 2>&1 || true
    launchctl load -w "$plist_file" >/dev/null 2>&1 || true
}

# ---------- 检查更新分支 ----------
if [ "$MODE" = "check-update" ]; then
    info "正在检测 GitHub 最新发行版 (${REPO})..."
    API_URL="https://api.github.com/repos/${REPO}/releases/latest"
    if ! command -v curl >/dev/null 2>&1; then
        die "未找到 curl 命令，请直接访问: ${RELEASES_URL}"
    fi

    RESP="$(curl -sL --max-time 10 -H "User-Agent: Antigravity-Theme-Updater" "$API_URL" || true)"
    REMOTE_TAG="$(printf "%s" "$RESP" | grep -m1 '"tag_name"' | sed -E 's/.*"tag_name"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/' || true)"
    PUBLISHED_AT="$(printf "%s" "$RESP" | grep -m1 '"published_at"' | sed -E 's/.*"published_at"[[:space:]]*:[[:space:]]*"([^T"]+)".*/\1/' || true)"
    HTML_URL="$(printf "%s" "$RESP" | grep -m1 '"html_url"' | sed -E 's/.*"html_url"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/' || true)"
    [ -n "$HTML_URL" ] || HTML_URL="$RELEASES_URL"
    [ -n "$PUBLISHED_AT" ] || PUBLISHED_AT="近期"

    if [ -z "$REMOTE_TAG" ]; then
        warn "检查更新失败（无法获取远端版本信息，或仓库尚未发布正式 Release）。"
        printf "${C_GRAY}    您也可以随时直接在浏览器中访问：${C_RESET}\n"
        printf "${C_CYAN}    %s${C_RESET}\n" "$RELEASES_URL"
        exit 0
    fi

    R_CLEAN="${REMOTE_TAG#v}"; R_CLEAN="${R_CLEAN#V}"
    C_CLEAN="${CURRENT_VERSION#v}"; C_CLEAN="${C_CLEAN#V}"

    if [ "$R_CLEAN" != "$C_CLEAN" ] && [ "$(printf "%s\n%s\n" "$C_CLEAN" "$R_CLEAN" | sort -V | tail -n1)" = "$R_CLEAN" ]; then
        echo ""
        ok "发现新版本：${REMOTE_TAG} （当前版本：${CURRENT_VERSION}）"
        printf "${C_GRAY}    发布时间：%s${C_RESET}\n" "$PUBLISHED_AT"
        if [ -f "$UPDATER_SCRIPT" ] && command -v node >/dev/null 2>&1; then
            SUMMARY_TEXT="$(node "$UPDATER_SCRIPT" check --platform macos 2>/dev/null | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')||'{}'); console.log((d.summary||[]).join('\n'));" 2>/dev/null || true)"
            if [ -n "$SUMMARY_TEXT" ]; then
                printf "\n${C_YELLOW}更新内容描述：${C_RESET}\n"
                printf "${C_GRAY}%s${C_RESET}\n" "$SUMMARY_TEXT"
            fi
        fi
        echo ""
        if [ "$NON_INTERACTIVE" -eq 0 ]; then
            read -r -p "是否立即自动下载校验并更新？(Y=自动更新 / B=仅打开浏览器 / N=取消) [默认 Y]: " OPEN_ANS || OPEN_ANS="Y"
            if [ -z "$OPEN_ANS" ] || [[ "$OPEN_ANS" =~ ^[Yy] ]]; then
                exec bash "$0" --update ${CUSTOM_APP_PATH:+--app-path "$CUSTOM_APP_PATH"}
            elif [[ "$OPEN_ANS" =~ ^[Bb] ]]; then
                open "$HTML_URL" >/dev/null 2>&1 || true
                ok "已调起默认浏览器打开发布页面。"
            fi
        fi
    else
        ok "当前已是最新版本 (${CURRENT_VERSION})，无需更新。"
    fi
    exit 0
fi

# ---------- 定位 Antigravity.app ----------
normalize_app_path() {
    local input="$1"
    input="${input%/}"
    if [ -f "$input" ] && [ "$(basename "$input")" = "app.asar" ]; then
        echo "$(cd "$(dirname "$input")/../.." && pwd)"
        return 0
    elif [ -d "$input" ] && [ -f "$input/app.asar" ]; then
        echo "$(cd "$input/../.." && pwd)"
        return 0
    elif [ -d "$input" ] && [ -f "$input/Contents/Resources/app.asar" ]; then
        echo "$(cd "$input" && pwd)"
        return 0
    fi
    return 1
}

find_antigravity_app() {
    if [ -n "$CUSTOM_APP_PATH" ]; then
        if normalize_app_path "$CUSTOM_APP_PATH"; then
            return 0
        fi
        die "指定的路径下未找到 Contents/Resources/app.asar: $CUSTOM_APP_PATH"
    fi

    local candidates=(
        "/Applications/Antigravity.app"
        "${USER_HOME}/Applications/Antigravity.app"
    )
    for c in "${candidates[@]}"; do
        if [ -f "$c/Contents/Resources/app.asar" ]; then
            echo "$c"
            return 0
        fi
    done

    if command -v mdfind >/dev/null 2>&1; then
        local spot
        spot="$(mdfind "kMDItemCFBundleIdentifier == 'com.google.antigravity'" 2>/dev/null | head -n 1 || true)"
        if [ -n "$spot" ] && [ -f "$spot/Contents/Resources/app.asar" ]; then
            echo "$spot"
            return 0
        fi
    fi

    if [ "$NON_INTERACTIVE" -eq 0 ]; then
        warn "未在默认位置 (/Applications/Antigravity.app) 找到 Antigravity 客户端。"
        read -r -p "请将 Antigravity.app 拖入终端窗口后按回车（或直接回车退出）: " USER_INPUT_PATH || USER_INPUT_PATH=""
        USER_INPUT_PATH="${USER_INPUT_PATH//\\ / }"
        USER_INPUT_PATH="${USER_INPUT_PATH#\'}"
        USER_INPUT_PATH="${USER_INPUT_PATH%\'}"
        USER_INPUT_PATH="${USER_INPUT_PATH#\"}"
        USER_INPUT_PATH="${USER_INPUT_PATH%\"}"
        if [ -n "$USER_INPUT_PATH" ] && normalize_app_path "$USER_INPUT_PATH"; then
            return 0
        fi
    fi

    return 1
}

APP_PATH="$(find_antigravity_app)" || die "未找到 Antigravity.app。请确认已安装官方 Antigravity 客户端。"
RES_DIR="${APP_PATH}/Contents/Resources"
ASAR_PATH="${RES_DIR}/app.asar"
APP_THEME_DIR="${RES_DIR}/custom-theme"
USER_THEME_DIR="${USER_DATA_DIR}/custom-theme"

ok "已定位客户端：${APP_PATH}"

# ---------- 载荷与核心引擎校验 (Fail-Fast) ----------
if [ ! -f "$MANIFEST_PATH" ]; then
    die "缺少清单文件 manifest.json —— 请在完整的主题包目录内运行本脚本。"
fi
if [ "$MODE" = "install" ]; then
    for f in "${PAYLOADS[@]}"; do
        if ! resolve_payload_file "$f" >/dev/null; then
            die "缺少主题文件 ${f}（请先运行 pnpm build 或在完整的发行包目录内运行本脚本）。"
        fi
    done
fi

# ---------- 选择零依赖 ASAR 处理运行时 (内置 Electron Node -> 系统 Node -> Python 3) ----------
NODE_BIN=""
NODE_ENV_ARGS=()

select_asar_runtime() {
    if [ -f "$PATCHER_SCRIPT" ]; then
        local electron_candidates=(
            "${APP_PATH}/Contents/MacOS/Antigravity"
            "/Applications/Antigravity.app/Contents/MacOS/Antigravity"
            "${USER_HOME}/Applications/Antigravity.app/Contents/MacOS/Antigravity"
        )
        for bin in "${electron_candidates[@]}"; do
            if [ -x "$bin" ]; then
                if ELECTRON_RUN_AS_NODE=1 ELECTRON_NO_ASAR=1 "$bin" -e "process.exit(0)" >/dev/null 2>&1; then
                    NODE_BIN="$bin"
                    NODE_ENV_ARGS=("ELECTRON_RUN_AS_NODE=1" "ELECTRON_NO_ASAR=1")
                    return 0
                fi
            fi
        done

        if command -v node >/dev/null 2>&1; then
            NODE_BIN="$(command -v node)"
            NODE_ENV_ARGS=("ELECTRON_NO_ASAR=1")
            return 0
        fi
    fi

    if command -v python3 >/dev/null 2>&1; then
        NODE_BIN="PYTHON3_FALLBACK"
        return 0
    fi

    die "未找到可用的 Node.js 运行时或 Python 3，无法处理 app.asar。"
}

select_asar_runtime

# ---------- 核心 ASAR 处理引擎 (统一调用 core/asar-patcher.js，Python 3 读取 manifest.json 兜底) ----------
run_asar_engine() {
    local action="$1"
    local target_asar="$2"
    local output_asar="${3:-}"

    if [ "$NODE_BIN" != "PYTHON3_FALLBACK" ]; then
        if [ -n "$output_asar" ]; then
            env "${NODE_ENV_ARGS[@]}" "$NODE_BIN" "$PATCHER_SCRIPT" "$action" "$target_asar" "$output_asar"
        else
            env "${NODE_ENV_ARGS[@]}" "$NODE_BIN" "$PATCHER_SCRIPT" "$action" "$target_asar"
        fi
    else
        python3 - "$MANIFEST_PATH" "$action" "$target_asar" "$output_asar" <<'PY_EOF'
import sys, json, struct, hashlib, re, platform

manifest_path = sys.argv[1]
action = sys.argv[2]
target_asar = sys.argv[3]
output_asar = sys.argv[4] if len(sys.argv) > 4 else ""

with open(manifest_path, "r", encoding="utf-8") as mf:
    MANIFEST = json.load(mf)

ANCHORS = MANIFEST.get("anchors", [])
FALLBACK_RE = MANIFEST.get("anchorFallbackRegex")
HOOK_VERSION = MANIFEST.get("hookVersion", "v1")
HOOK_START = MANIFEST.get("hookStartMarker", f"/* === Antigravity Custom Theme Hook {HOOK_VERSION} === */")
HOOK_END = MANIFEST.get("hookEndMarker", "/* === End Antigravity Custom Theme Hook === */")
LEGACY_MARKER = MANIFEST.get("legacyMarker", "custom-theme injection hook")

def find_anchor(text):
    for a in ANCHORS:
        if a in text:
            return a
    if FALLBACK_RE:
        m = re.search(FALLBACK_RE, text)
        if m:
            return m.group(0)
    return None

HOOK_BLOCK = f"""
{HOOK_START}
try {{
    const path_ = require('path');
    const fs_ = require('fs');
    const _ctCandidates = [
        path_.join(process.resourcesPath || '', 'custom-theme'),
        (typeof electron_1 !== 'undefined' && electron_1.app && typeof electron_1.app.getPath === 'function')
            ? path_.join(electron_1.app.getPath('userData'), 'custom-theme') : '',
        path_.join(process.env.HOME || '', 'Library', 'Application Support', 'Antigravity', 'custom-theme'),
        path_.join(process.env.APPDATA || '', 'Antigravity', 'custom-theme')
    ].filter(Boolean);
    const _ctRead = (name) => {{
        for (const _d of _ctCandidates) {{
            try {{
                const _f = path_.join(_d, name);
                if (fs_.existsSync(_f)) return fs_.readFileSync(_f, 'utf8');
            }} catch (e) {{}}
        }}
        return null;
    }};
    const _ctInject = () => {{
        try {{
            if (win.isDestroyed?.() || win.webContents?.isDestroyed?.()) return;
            const _css = _ctRead('current.css');
            if (_css && _css.trim()) win.webContents.insertCSS(_css).catch(() => {{}});
            const _js = _ctRead('current.js');
            if (_js && _js.trim()) win.webContents.executeJavaScript(_js, true).catch(() => {{}});
        }} catch (e) {{}}
    }};
    win.webContents.on('dom-ready', _ctInject);
    win.webContents.on('did-finish-load', _ctInject);
}} catch (e) {{}}
{HOOK_END}"""

def collect_utils(root):
    found = []
    def walk(node, rel):
        files = node.get("files") if isinstance(node, dict) else None
        if not isinstance(files, dict):
            return
        for name, child in files.items():
            if not isinstance(child, dict):
                continue
            nxt = f"{rel}/{name}" if rel else name
            if "files" in child:
                walk(child, nxt)
            elif name == "utils.js" and "offset" in child and "size" in child:
                found.append((nxt, child))
    walk(root, "")
    found.sort(key=lambda item: (0 if item[0] == "dist/utils.js" else 1, item[0]))
    return found

def parse_asar(path):
    with open(path, "rb") as f:
        buf = f.read()
    u0, H, payload_size, json_len = struct.unpack("<IIII", buf[:16])
    data_start = 8 + H
    tree = json.loads(buf[16:16+json_len].decode("utf-8"))
    candidates = collect_utils(tree)
    if not candidates:
        raise RuntimeError("ASAR 头部未找到 utils.js 条目")
    selected = None
    for rel, node in candidates:
        off, sz = int(node["offset"]), int(node["size"])
        if off < 0 or sz <= 0 or data_start + off + sz > len(buf):
            continue
        content = buf[data_start+off:data_start+off+sz].decode("utf-8")
        if find_anchor(content) or HOOK_START in content or LEGACY_MARKER in content:
            selected = (rel, node, off, sz, content)
            break
        if selected is None:
            selected = (rel, node, off, sz, content)
    if selected is None:
        raise RuntimeError("ASAR 中的 utils.js 偏移或大小越界")
    return buf, data_start, tree, selected[0], selected[1], selected[2], selected[3], selected[4]

def strip_hooks(text):
    out = re.sub(r"\r?\n/\* === Antigravity Custom Theme Hook v\d+ === \*/[\s\S]*?/\* === End Antigravity Custom Theme Hook === \*/", "", text)
    out = re.sub(r"/\* === Antigravity Custom Theme Hook v\d+ === \*/[\s\S]*?/\* === End Antigravity Custom Theme Hook === \*/\r?\n?", "", out)
    out = re.sub(r"[ \t]*// === Antigravity custom-theme injection hook(?: v\d+)? \(start\) ===[\s\S]*?// === Antigravity custom-theme injection hook(?: v\d+)? \(end\) ===\r?\n?", "", out)
    return out

def verify_integrity(buf, data_start, node):
    off, sz = int(node["offset"]), int(node["size"])
    if off < 0 or sz < 0 or data_start + off + sz > len(buf):
        return False
    integ = node.get("integrity")
    if not integ:
        return True
    data = buf[data_start+off:data_start+off+sz]
    if hashlib.sha256(data).hexdigest() != str(integ.get("hash", "")).lower():
        return False
    bs = int(integ.get("blockSize", 4194304)) or 4194304
    blocks = integ.get("blocks", [])
    expected = 0 if sz == 0 else (sz + bs - 1) // bs
    if len(blocks) != expected:
        return False
    for i, b in enumerate(blocks):
        if hashlib.sha256(data[i*bs:(i+1)*bs]).hexdigest() != str(b).lower():
            return False
    return True

def rebuild_asar(buf, data_start, tree, u_node, old_off, old_sz, new_str):
    new_bytes = new_str.encode("utf-8")
    delta = len(new_bytes) - old_sz
    u_node["size"] = len(new_bytes)
    bs = int(u_node.get("integrity", {}).get("blockSize", 4194304)) or 4194304
    blocks = [hashlib.sha256(new_bytes[i:i+bs]).hexdigest() for i in range(0, len(new_bytes), bs)]
    u_node["integrity"] = {
        "algorithm": "SHA256",
        "hash": hashlib.sha256(new_bytes).hexdigest(),
        "blockSize": bs,
        "blocks": blocks
    }
    def shift(node):
        if "files" not in node:
            return
        for v in node["files"].values():
            if "files" in v:
                shift(v)
            elif "offset" in v and int(v["offset"]) > old_off:
                v["offset"] = str(int(v["offset"]) + delta)
    shift(tree)
    new_json = json.dumps(tree, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    pad = (4 - (len(new_json) % 4)) % 4
    new_payload = 4 + len(new_json) + pad
    new_H = 8 + len(new_json) + pad
    hdr = struct.pack("<IIII", 4, new_H, new_payload, len(new_json)) + new_json + (b"\x00" * pad)
    return hdr + buf[data_start:data_start+old_off] + new_bytes + buf[data_start+old_off+old_sz:]

buf, data_start, tree, u_path, u_node, off, sz, content = parse_asar(target_asar)
has_v1 = HOOK_START in content and HOOK_END in content
has_legacy = LEGACY_MARKER in content
matched_anchor = find_anchor(content)
has_anchor = matched_anchor is not None

if action == "inspect":
    if not has_anchor:
        sys.exit(2)
    print("PATCHED_V1" if has_v1 else ("PATCHED_LEGACY" if has_legacy else "CLEAN"))
elif action == "doctor":
    integ_ok = verify_integrity(buf, data_start, u_node)
    status = "ANCHOR_MISSING" if not has_anchor else ("PATCHED_V1" if has_v1 else ("PATCHED_LEGACY" if has_legacy else "CLEAN"))
    print("--- Antigravity Theme Doctor (Python fallback) ---")
    print(f"Theme Version  : {MANIFEST.get('version')} ({MANIFEST.get('repo')})")
    print(f"Platform       : {platform.system()}/{platform.machine()} (Python {platform.python_version()})")
    print(f"ASAR Size      : {len(buf)} bytes (sha256:{hashlib.sha256(buf).hexdigest()[:16]}...)")
    print(f"Utils Entry    : {u_path} ({sz} bytes)")
    print(f"Patch Status   : {status}")
    print(f"Matched Anchor : {matched_anchor or '<NONE>'}")
    print(f"Integrity OK   : {integ_ok}")
    print("--------------------------------------------------")
    sys.exit(0 if (has_anchor and integ_ok) else 2)
elif action == "verify-patched":
    if has_v1 and has_anchor and "_ctCandidates" in content and verify_integrity(buf, data_start, u_node):
        print("VERIFY_OK")
        sys.exit(0)
    sys.exit(1)
elif action == "verify-clean":
    if not has_v1 and not has_legacy and has_anchor and verify_integrity(buf, data_start, u_node):
        print("CLEAN_OK")
        sys.exit(0)
    sys.exit(1)
elif action == "strip":
    clean_u = strip_hooks(content)
    out = rebuild_asar(buf, data_start, tree, u_node, off, sz, clean_u)
    with open(output_asar, "wb") as f:
        f.write(out)
    print("STRIP_OK")
elif action == "inject":
    clean_u = strip_hooks(content)
    anchor_to_use = find_anchor(clean_u)
    if not anchor_to_use:
        raise RuntimeError("未找到注入锚点（loadHubWindowUrl / win.loadURL）")
    new_u = clean_u.replace(anchor_to_use, anchor_to_use + HOOK_BLOCK, 1)
    out = rebuild_asar(buf, data_start, tree, u_node, off, sz, new_u)
    with open(output_asar, "wb") as f:
        f.write(out)
    print(f"INJECT_OK:{len(out) - len(buf)}")
PY_EOF
    fi
}

# ---------- 停用宿主升级自动恢复 (--disable-auto-heal) ----------
if [ "$MODE" = "disable-auto-heal" ]; then
    PLIST_FILE="${USER_HOME}/Library/LaunchAgents/${LAUNCH_AGENT_LABEL}.plist"
    REMOVED_ANY=0
    if [ -f "$PLIST_FILE" ]; then
        launchctl unload "$PLIST_FILE" >/dev/null 2>&1 || true
        rm -f "$PLIST_FILE"
        ok "已停用并移除宿主升级自动恢复监听 (${PLIST_FILE})"
        REMOVED_ANY=1
    fi
    if cleanup_legacy_launch_agent; then
        ok "已同时清理旧版 LaunchAgent (${LEGACY_LAUNCH_AGENT_LABEL})"
        REMOVED_ANY=1
    fi
    if [ "$REMOVED_ANY" -eq 0 ]; then
        ok "当前未启用宿主升级自动恢复监听。"
    fi
    exit 0
fi

# ---------- 只读诊断模式 (--doctor) ----------
if [ "$MODE" = "doctor" ]; then
    APP_VER="unknown"
    PLIST_PATH="${APP_PATH}/Contents/Info.plist"
    if [ -f "$PLIST_PATH" ] && command -v defaults >/dev/null 2>&1; then
        APP_VER="$(defaults read "$PLIST_PATH" CFBundleShortVersionString 2>/dev/null || echo "unknown")"
    fi
    info "Antigravity Version: ${APP_VER} | Runtime: ${NODE_BIN}"
    run_asar_engine doctor "$ASAR_PATH"
    exit $?
fi

# ---------- 启用宿主升级自动恢复 (--enable-auto-heal) ----------
if [ "$MODE" = "enable-auto-heal" ]; then
    if cleanup_legacy_launch_agent; then
        ok "已迁移并移除旧版 LaunchAgent (${LEGACY_LAUNCH_AGENT_LABEL})"
    fi
    write_launch_agent_plist
    ok "已启用宿主升级自动恢复监听 (LaunchAgent: ${LAUNCH_AGENT_LABEL})"
    printf "${C_GRAY}    监听目标: %s${C_RESET}\n" "$ASAR_PATH"
    printf "${C_GRAY}    停用命令: ./install.sh --disable-auto-heal${C_RESET}\n"
    exit 0
fi

# ---------- 静默自愈模式 (--auto-heal，宿主更新覆盖 app.asar 后自动恢复) ----------
if [ "$MODE" = "auto-heal" ]; then
    ASAR_STATE="$(run_asar_engine inspect "$ASAR_PATH" 2>/dev/null || echo "ANCHOR_MISSING")"
    if [ "$ASAR_STATE" = "PATCHED_V1" ]; then
        exit 0
    fi
    if [ "$ASAR_STATE" = "ANCHOR_MISSING" ]; then
        warn "检测到 Antigravity 已升级且注入锚点发生变化，已安全跳过自动恢复。请运行 ./install.sh --update 更新主题包。"
        if command -v osascript >/dev/null 2>&1; then
            osascript -e 'display notification "Antigravity 锚点已变化，请运行 ./install.sh --update 更新主题包" with title "Antigravity Theme"' >/dev/null 2>&1 || true
        fi
        exit 2
    fi
    info "检测到宿主升级覆盖了 app.asar (${ASAR_STATE})，正在静默恢复主题注入..."
    MODE="install"
    NON_INTERACTIVE=1
fi

# ---------- 一键在线自动更新 (--update) ----------
if [ "$MODE" = "update" ]; then
    [ "$NODE_BIN" != "PYTHON3_FALLBACK" ] || die "在线自动更新需要 Node.js / Antigravity 内置运行时。"
    [ -f "$UPDATER_SCRIPT" ] || die "缺少更新引擎 core/updater.js —— 请在完整目录内运行。"
    info "正在检查并拉取最新发行版 (${REPO})..."
    CHECK_JSON="$(env "${NODE_ENV_ARGS[@]}" "$NODE_BIN" "$UPDATER_SCRIPT" check --platform macos)" || die "检查更新失败，请检查网络连接。"
    HAS_UPDATE="$(printf '%s' "$CHECK_JSON" | env "${NODE_ENV_ARGS[@]}" "$NODE_BIN" -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.hasUpdate ? '1' : '0');")"
    REMOTE_TAG="$(printf '%s' "$CHECK_JSON" | env "${NODE_ENV_ARGS[@]}" "$NODE_BIN" -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.remoteTag || '');")"
    if [ "$HAS_UPDATE" != "1" ]; then
        ok "当前已是最新版本 (${CURRENT_VERSION})，无需更新。"
        exit 0
    fi

    SUMMARY_TEXT="$(printf '%s' "$CHECK_JSON" | env "${NODE_ENV_ARGS[@]}" "$NODE_BIN" -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log((d.summary||[]).join('\n'));")"
    if [ -n "$SUMMARY_TEXT" ]; then
        printf "\n${C_YELLOW}本次版本更新描述 (${REMOTE_TAG})：${C_RESET}\n"
        printf "${C_GRAY}%s${C_RESET}\n\n" "$SUMMARY_TEXT"
    fi

    info "发现新版本 ${REMOTE_TAG}，正在下载并校验 SHA256SUMS.txt..."
    TMP_UPD_DIR="$(mktemp -d "${TMPDIR:-/tmp}/ag-theme-update.XXXXXX")"
    trap 'rm -rf "$TMP_UPD_DIR"' EXIT
    DL_JSON="$(env "${NODE_ENV_ARGS[@]}" "$NODE_BIN" "$UPDATER_SCRIPT" download "$TMP_UPD_DIR" --platform macos)" || die "下载或 SHA256 校验失败，已终止更新。"
    STAGING_DIR="$(printf '%s' "$DL_JSON" | env "${NODE_ENV_ARGS[@]}" "$NODE_BIN" -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.stagingDir);")"
    HOOK_CHANGED="$(printf '%s' "$DL_JSON" | env "${NODE_ENV_ARGS[@]}" "$NODE_BIN" -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.hookChanged ? '1' : '0');")"
    CHECKSUM_OK="$(printf '%s' "$DL_JSON" | env "${NODE_ENV_ARGS[@]}" "$NODE_BIN" -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(d.checksumVerified ? '1' : '0');")"
    [ "$CHECKSUM_OK" = "1" ] && ok "ZIP 完整性校验通过 (SHA256SUMS.txt)"

    ASAR_STATE="$(run_asar_engine inspect "$ASAR_PATH" 2>/dev/null || echo "UNKNOWN")"
    if [ "$HOOK_CHANGED" = "0" ] && [ "$ASAR_STATE" = "PATCHED_V1" ]; then
        info "Hook 无需变动，执行零中断热更新..."
        env "${NODE_ENV_ARGS[@]}" "$NODE_BIN" "$UPDATER_SCRIPT" apply "$STAGING_DIR" "$SCRIPT_DIR" "$APP_THEME_DIR" "$USER_THEME_DIR" >/dev/null
        fix_user_ownership "$USER_DATA_DIR"
        ok "热更新完成：${CURRENT_VERSION} -> ${REMOTE_TAG}！在 Antigravity 窗口按 Cmd + R 即可秒级生效。"
        exit 0
    else
        info "检测到需要重新注入 app.asar (hookChanged=${HOOK_CHANGED}, state=${ASAR_STATE})，正在同步文件并重新安装..."
        env "${NODE_ENV_ARGS[@]}" "$NODE_BIN" "$UPDATER_SCRIPT" apply "$STAGING_DIR" "$SCRIPT_DIR" >/dev/null
        rm -rf "$TMP_UPD_DIR"
        trap - EXIT
        if [ "$NON_INTERACTIVE" -eq 1 ]; then
            exec bash "${SCRIPT_DIR}/install.sh" --install --app-path "$APP_PATH" --non-interactive
        else
            exec bash "${SCRIPT_DIR}/install.sh" --install --app-path "$APP_PATH"
        fi
    fi
fi

# ---------- 目录写权限检查与按需 sudo 提权 ----------
if [ ! -w "$RES_DIR" ] || [ ! -w "$ASAR_PATH" ]; then
    if [ "${EUID:-$(id -u)}" -ne 0 ]; then
        if [ "$NON_INTERACTIVE" -eq 1 ]; then
            die "目标目录没有写权限 (${RES_DIR})，请使用 sudo 运行或修改目录权限。"
        fi
        warn "目标应用目录 (${RES_DIR}) 需要管理员权限写入，正在请求 sudo 授权..."
        exec sudo -E bash "$0" "$@"
    else
        die "无法写入目标文件: ${ASAR_PATH} (请检查 SIP 或文件系统只读状态)"
    fi
fi

# ---------- 检测并优雅关闭运行中的 Antigravity 进程 ----------
WAS_RUNNING=0
check_and_quit_running_app() {
    local pids=()
    while IFS= read -r p; do
        [ -n "$p" ] && pids+=("$p")
    done < <(pgrep -f "${APP_PATH}/Contents/MacOS/Antigravity" 2>/dev/null || true)

    if [ "${#pids[@]}" -eq 0 ]; then
        return 0
    fi

    WAS_RUNNING=1
    if [ "$NON_INTERACTIVE" -eq 1 ]; then
        info "非交互模式 (--non-interactive)：保持当前运行中的 Antigravity 会话不中断，下次重启客户端即生效。"
        return 0
    fi

    warn "检测到目标 Antigravity 正在运行（${#pids[@]} 个关联进程）。"
    read -r -p "是否自动关闭它并继续？(Y/N) [默认 Y]: " QUIT_ANS || QUIT_ANS="Y"
    if [ -z "$QUIT_ANS" ] || [[ "$QUIT_ANS" =~ ^[Yy] ]]; then
        info "正在请求 Antigravity 优雅退出..."
        osascript -e 'tell application "Antigravity" to quit' >/dev/null 2>&1 || true
        for _ in {1..20}; do
            if ! pgrep -f "${APP_PATH}/Contents/MacOS/Antigravity" >/dev/null 2>&1; then
                break
            fi
            sleep 0.25
        done
        if pgrep -f "${APP_PATH}/Contents/MacOS/Antigravity" >/dev/null 2>&1; then
            pkill -TERM -f "${APP_PATH}/Contents/MacOS/Antigravity" 2>/dev/null || true
            for _ in {1..12}; do
                if ! pgrep -f "${APP_PATH}/Contents/MacOS/Antigravity" >/dev/null 2>&1; then
                    break
                fi
                sleep 0.25
            done
        fi
        ok "已关闭 Antigravity"
    else
        die "请手动关闭 Antigravity 后重新运行本脚本。"
    fi
}

check_and_quit_running_app

# ---------- 卸载流程 ----------
if [ "$MODE" = "uninstall" ]; then
    info "正在执行卸载与原厂状态还原..."
    ASAR_STATE="$(run_asar_engine inspect "$ASAR_PATH" || echo "ERROR")"

    if [ -f "$BACKUP_PATH" ]; then
        BACKUP_STATE="$(run_asar_engine inspect "$BACKUP_PATH" || echo "ERROR")"
        if [ "$ASAR_STATE" = "CLEAN" ]; then
            warn "当前 app.asar 未检测到主题钩子（客户端可能已升级），跳过备份覆盖以避免版本降级。"
            rm -f "$BACKUP_PATH"
        elif [ "$BACKUP_STATE" = "CLEAN" ]; then
            TMP_RESTORE="${ASAR_PATH}.restore.tmp"
            cp -f "$BACKUP_PATH" "$TMP_RESTORE"
            if run_asar_engine verify-clean "$TMP_RESTORE" >/dev/null 2>&1; then
                mv -f "$TMP_RESTORE" "$ASAR_PATH"
                rm -f "$BACKUP_PATH"
                ok "已从原厂备份还原 app.asar 并清理备份 (${BACKUP_PATH})"
            else
                rm -f "$TMP_RESTORE"
                die "备份文件校验异常，已取消还原。"
            fi
        else
            warn "备份文件含钩子或状态异常，正在通过逆向剥离引擎直接还原原厂 app.asar..."
            TMP_RESTORE="${ASAR_PATH}.restore.tmp"
            run_asar_engine strip "$ASAR_PATH" "$TMP_RESTORE" >/dev/null
            mv -f "$TMP_RESTORE" "$ASAR_PATH"
            rm -f "$BACKUP_PATH"
            ok "已通过逆向剥离引擎还原原厂 app.asar"
        fi
    else
        if [[ "$ASAR_STATE" == PATCHED_* ]]; then
            info "未找到外部备份文件，正在通过逆向剥离自愈引擎无损还原原厂 app.asar..."
            TMP_RESTORE="${ASAR_PATH}.restore.tmp"
            run_asar_engine strip "$ASAR_PATH" "$TMP_RESTORE" >/dev/null
            mv -f "$TMP_RESTORE" "$ASAR_PATH"
            ok "已无损剥离主题钩子并恢复原厂 app.asar（字节级一致）"
        else
            ok "当前 app.asar 已是原厂纯净状态"
        fi
    fi

    if [ -d "$APP_THEME_DIR" ]; then
        rm -rf "$APP_THEME_DIR"
        ok "已删除 ${APP_THEME_DIR}"
    fi

    # 若操作的是真实应用目录（非 /tmp 沙盒），同步清理用户目录与 LaunchAgent
    case "$APP_PATH" in
        /tmp/*|/var/folders/*)
            ;;
        *)
            if [ -d "$USER_THEME_DIR" ]; then
                rm -rf "$USER_THEME_DIR"
                ok "已删除 ${USER_THEME_DIR}"
            fi
            NEW_PLIST="${USER_HOME}/Library/LaunchAgents/${LAUNCH_AGENT_LABEL}.plist"
            if [ -f "$NEW_PLIST" ]; then
                launchctl unload "$NEW_PLIST" >/dev/null 2>&1 || true
                rm -f "$NEW_PLIST"
                ok "已停用并移除 LaunchAgent (${LAUNCH_AGENT_LABEL})"
            fi
            if cleanup_legacy_launch_agent; then
                ok "已同时清理旧版 LaunchAgent (${LEGACY_LAUNCH_AGENT_LABEL})"
            fi
            ;;
    esac

    echo ""
    ok "卸载完成。重启 Antigravity 即恢复原版外观。"
    exit 0
fi

# ---------- 安装流程：1) 预检 app.asar ----------
ASAR_STATE="$(run_asar_engine inspect "$ASAR_PATH")" || die "解析 app.asar 失败或未找到注入锚点（客户端结构可能已变化，可运行 ./install.sh --doctor 查看诊断信息），已取消修改。"

# ---------- 安装流程：2) 原厂备份与逆向剥离自愈 ----------
mkdir -p "$BACKUP_DIR"
fix_user_ownership "$BACKUP_DIR"

if [ "$ASAR_STATE" = "CLEAN" ]; then
    if [ -f "$BACKUP_PATH" ]; then
        CUR_HASH="$(shasum -a 256 "$ASAR_PATH" | awk '{print $1}')"
        BAK_HASH="$(shasum -a 256 "$BACKUP_PATH" | awk '{print $1}')"
        if [ "$CUR_HASH" != "$BAK_HASH" ]; then
            cp -f "$ASAR_PATH" "$BACKUP_PATH"
            fix_user_ownership "$BACKUP_PATH"
            ok "检测到客户端版本已更新，已同步刷新原厂备份 -> ${BACKUP_PATH}"
        else
            ok "原厂备份已存在且哈希一致 -> ${BACKUP_PATH}"
        fi
    else
        cp -f "$ASAR_PATH" "$BACKUP_PATH"
        fix_user_ownership "$BACKUP_PATH"
        ok "已备份原版 app.asar -> ${BACKUP_PATH}"
    fi
else
    NEED_HEAL=0
    if [ ! -f "$BACKUP_PATH" ]; then
        NEED_HEAL=1
    else
        BAK_STATE="$(run_asar_engine inspect "$BACKUP_PATH" 2>/dev/null || echo "ERROR")"
        if [ "$BAK_STATE" != "CLEAN" ]; then
            NEED_HEAL=1
        fi
    fi

    if [ "$NEED_HEAL" -eq 1 ]; then
        info "检测到 app.asar 已注入但原厂备份缺失，正在执行逆向剥离自愈重建备份..."
        TMP_STOCK="${BACKUP_PATH}.tmp"
        run_asar_engine strip "$ASAR_PATH" "$TMP_STOCK" >/dev/null
        mv -f "$TMP_STOCK" "$BACKUP_PATH"
        fix_user_ownership "$BACKUP_PATH"
        ok "已通过自愈引擎重建原厂纯净备份 -> ${BACKUP_PATH}"
    else
        ok "原厂纯净备份校验正常 -> ${BACKUP_PATH}"
    fi
fi

# ---------- 安装流程：3) 分发主题文件到双目录 ----------
mkdir -p "$APP_THEME_DIR"
mkdir -p "$USER_THEME_DIR"
for f in "${PAYLOADS[@]}"; do
    SRC_FILE="$(resolve_payload_file "$f")" || die "无法定位主题载荷文件: ${f}"
    cp -f "$SRC_FILE" "${APP_THEME_DIR}/${f}"
    cp -f "$SRC_FILE" "${USER_THEME_DIR}/${f}"
done
fix_user_ownership "$USER_DATA_DIR"
ok "主题文件已分发至双目录:"
printf "${C_GRAY}    1) %s${C_RESET}\n" "$APP_THEME_DIR"
printf "${C_GRAY}    2) %s${C_RESET}\n" "$USER_THEME_DIR"

# ---------- 安装流程：4) 注入跨平台 Hook 到 app.asar (保留 Info.plist 与签名不动) ----------
TMP_ASAR="${ASAR_PATH}.tmp"
rm -f "$TMP_ASAR"

if INJECT_OUT="$(run_asar_engine inject "$ASAR_PATH" "$TMP_ASAR")"; then
    if run_asar_engine verify-patched "$TMP_ASAR" >/dev/null 2>&1; then
        mv -f "$TMP_ASAR" "$ASAR_PATH"
        DELTA_BYTES="${INJECT_OUT#INJECT_OK:}"
        ok "app.asar 注入完成（净增 ${DELTA_BYTES} 字节，保留原始 Info.plist 与 Mach-O 签名）"
    else
        rm -f "$TMP_ASAR"
        die "临时文件 app.asar.tmp 完整性自检失败，已取消替换。"
    fi
else
    rm -f "$TMP_ASAR"
    die "构建 app.asar 补丁失败。"
fi

# ---------- 安装流程：5) 最终线上只读自检 ----------
if run_asar_engine verify-patched "$ASAR_PATH" >/dev/null 2>&1; then
    ok "最终自检通过：跨平台 Hook 已就绪且 SHA256 整包与 4MB 分块哈希一致"
else
    if [ -f "$BACKUP_PATH" ]; then
        cp -f "$BACKUP_PATH" "$ASAR_PATH" || true
        warn "已从原厂备份自动回滚 app.asar。"
    fi
    die "最终自检未通过，已回滚修改。"
fi

# ---------- 安装流程：6) 平滑迁移旧版 LaunchAgent ----------
case "$APP_PATH" in
    /tmp/*|/var/folders/*)
        ;;
    *)
        if cleanup_legacy_launch_agent; then
            write_launch_agent_plist
            ok "已将旧版 LaunchAgent 平滑迁移为 ${LAUNCH_AGENT_LABEL}"
        fi
        ;;
esac

echo ""
printf "${C_CYAN}================ 安装完成 ================${C_RESET}\n"
echo " 启动或重启 Antigravity，点击右上角主题按钮即可切换 7 大天体系列（Orbital / Prism / Zenith / Lagoon / Solar / Nova / Nebula）× 深浅共 14 款毛玻璃主题。"
echo " 卸载方式：双击 uninstall.command 或运行 ./install.sh --uninstall"
printf "${C_CYAN}==========================================${C_RESET}\n"

if [ "$NON_INTERACTIVE" -eq 0 ] && [ "$WAS_RUNNING" -eq 1 ]; then
    read -r -p "是否立即重新启动 Antigravity？(Y/N) [默认 Y]: " RELAUNCH_ANS || RELAUNCH_ANS="Y"
    if [ -z "$RELAUNCH_ANS" ] || [[ "$RELAUNCH_ANS" =~ ^[Yy] ]]; then
        open "$APP_PATH" >/dev/null 2>&1 || true
        ok "已启动 Antigravity"
    fi
fi
