#!/usr/bin/env bash
# Confere a zona do domínio próprio antes de mesclar o docs/CNAME.
#
# Uso: scripts/checar-dominio.sh [dominio]     (padrão: nuvem-sync.app.br)
#
# Não precisa de `dig` (não vem instalado por padrão em muitas máquinas): fala
# DNS direto com o 1.1.1.1. Sai com código 1 enquanto faltar algum registro.
set -euo pipefail

dominio="${1:-nuvem-sync.app.br}"
usuario_github="fabio-agreles"

python3 - "$dominio" "$usuario_github" <<'PY'
import random, socket, struct, sys

dominio, usuario = sys.argv[1], sys.argv[2]
TIPOS = {"A": 1, "AAAA": 28, "CNAME": 5, "NS": 2, "TXT": 16}
ESPERADOS_A = {"185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"}
ESPERADOS_AAAA = {"2606:50c0:8000::153", "2606:50c0:8001::153",
                  "2606:50c0:8002::153", "2606:50c0:8003::153"}


def ler_nome(data, off):
    partes, saltou, fim = [], False, off
    while True:
        tam = data[off]
        if tam == 0:
            off += 1
            if not saltou:
                fim = off
            return ".".join(partes), fim
        if tam & 0xC0 == 0xC0:
            ponteiro = struct.unpack(">H", data[off:off + 2])[0] & 0x3FFF
            if not saltou:
                fim, saltou = off + 2, True
            off = ponteiro
            continue
        partes.append(data[off + 1:off + 1 + tam].decode(errors="replace"))
        off += 1 + tam
        if not saltou:
            fim = off


def consulta(nome, tipo, servidor="1.1.1.1"):
    tid = random.randint(0, 65535)
    cabecalho = struct.pack(">HHHHHH", tid, 0x0100, 1, 0, 0, 0)
    pergunta = b"".join(bytes([len(p)]) + p.encode() for p in nome.split(".")) + b"\x00"
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(6)
    try:
        sock.sendto(cabecalho + pergunta + struct.pack(">HH", TIPOS[tipo], 1), (servidor, 53))
        data, _ = sock.recvfrom(4096)
    except OSError as erro:
        return None, [f"sem resposta ({erro})"]
    rcode = data[3] & 0x0F
    qd, an = struct.unpack(">HH", data[4:8])
    off = 12
    for _ in range(qd):
        _, off = ler_nome(data, off)
        off += 4
    respostas = []
    for _ in range(an):
        _, off = ler_nome(data, off)
        t, _classe, _ttl, tam = struct.unpack(">HHIH", data[off:off + 10])
        off += 10
        dados = data[off:off + tam]
        if t == 1:
            respostas.append(socket.inet_ntoa(dados))
        elif t == 28:
            respostas.append(socket.inet_ntop(socket.AF_INET6, dados))
        elif t in (2, 5):
            respostas.append(ler_nome(data, off)[0])
        elif t == 16:
            i, partes = 0, []
            while i < len(dados):
                n = dados[i]
                partes.append(dados[i + 1:i + 1 + n].decode(errors="replace"))
                i += 1 + n
            respostas.append("".join(partes))
        off += tam
    return rcode, respostas


def linha(ok, titulo, detalhe=""):
    print(f"{'✅' if ok else '⬜'} {titulo}" + (f"\n     {detalhe}" if detalhe else ""))
    return ok


tudo = True

rcode, ns = consulta(dominio, "NS")
tudo &= linha(bool(ns) and any("dns.br" in n for n in ns),
              "Delegação do domínio", " NS: " + (" | ".join(ns) if ns else "nenhum"))

rcode, a = consulta(dominio, "A")
faltam_a = ESPERADOS_A - set(a)
tudo &= linha(not faltam_a, f"A no apex ({len(a or [])}/4)",
              " encontrados: " + (" ".join(a) if a else "nenhum") +
              ("\n     faltam: " + " ".join(sorted(faltam_a)) if faltam_a else ""))

rcode, aaaa = consulta(dominio, "AAAA")
faltam_aaaa = ESPERADOS_AAAA - set(aaaa or [])
tudo &= linha(not faltam_aaaa, f"AAAA no apex ({len(aaaa or [])}/4, opcional)",
              " encontrados: " + (" ".join(aaaa) if aaaa else "nenhum"))

rcode, cname = consulta("www." + dominio, "CNAME")
tudo &= linha(any(usuario in c for c in cname),
              "www → GitHub Pages",
              " CNAME: " + (" | ".join(cname) if cname else "nenhum"))

rcode, txts = consulta(dominio, "TXT")
tem_google = any(t.startswith("google-site-verification=") for t in txts or [])
tudo &= linha(tem_google, "TXT do Search Console no apex (propriedade de Domínio)",
              " " + (" | ".join(txts) if txts else "nenhum TXT"))

rcode, desafio = consulta(f"_github-pages-challenge-{usuario}.{dominio}", "TXT")
tudo &= linha(bool(desafio), "TXT de verificação do GitHub (anti-takeover)",
              " " + (" | ".join(desafio) if desafio else "nenhum"))

print()
if tudo:
    print("Zona pronta: pode mesclar a branch dominio-cname e ligar o Custom domain.")
else:
    print("Ainda falta registro — complete no painel DNS do Registro.br e rode de novo.")
    sys.exit(1)
PY
