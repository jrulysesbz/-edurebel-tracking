# Bash-only URL encoder
urlencode() {
  local s="$1" i ch o=""
  LC_ALL=C
  for ((i=0; i<${#s}; i++)); do
    ch="${s:i:1}"
    case "$ch" in
      [a-zA-Z0-9._~-]) o+="$ch" ;;
      ' ')              o+='%20' ;;
      *)                printf -v o '%s%%%02X' "$o" "'$ch" ;;
    esac
  done
  printf '%s' "$o"
}
