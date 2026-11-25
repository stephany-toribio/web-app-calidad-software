import json
import getpass
from pathlib import Path
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError

BASE = "http://127.0.0.1:4201/api/v1"

PASSWORD = getpass.getpass(
    "Contraseña QA_FIXTURE_PASSWORD: "
)

RESULTADOS = []
TOKENS = set()

CUENTAS = {
    "candidato": "candidato1@qa.example.test",
    "empresa": "empresa1@qa.example.test",
    "admin": "admin@qa.example.test",
    "suspendido": "suspendido@qa.example.test"
}


def peticion(metodo, ruta, datos=None, token=None):

    headers = {
        "Accept": "application/json"
    }

    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = None

    if datos is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(datos).encode()

    req = Request(
        BASE + ruta,
        data=body,
        headers=headers,
        method=metodo
    )

    try:
        with urlopen(req, timeout=20) as respuesta:
            estado = respuesta.status
            contenido = respuesta.read()

    except HTTPError as error:
        estado = error.code
        contenido = error.read()

    try:
        contenido = json.loads(contenido)
    except (ValueError, UnicodeError):
        contenido = None

    return estado, contenido


def comprobar(caso, descripcion, esperado, obtenido,
              condicion=True):

    aprobado = esperado == obtenido and condicion

    registro = {
        "caso": caso,
        "descripcion": descripcion,
        "esperado": esperado,
        "obtenido": obtenido,
        "resultado": "PASS" if aprobado else "FAIL"
    }

    RESULTADOS.append(registro)

    print(
        f"[{registro['resultado']}] "
        f"{caso}: {descripcion} | "
        f"Esperado={esperado} Obtenido={obtenido}"
    )

    return aprobado


def login(rol, caso):

    estado, respuesta = peticion(
        "POST",
        "/auth/login",
        {
            "correo": CUENTAS[rol],
            "password": PASSWORD
        }
    )

    data = (respuesta or {}).get("data") or {}

    token = data.get("token")

    if token:
        TOKENS.add(token)

    correcto = comprobar(
        caso,
        f"Login {rol}",
        200,
        estado,
        bool(token) and data.get("rol") == rol
    )

    if not correcto:
        raise RuntimeError(f"Login fallido: {rol}")

    return token, data.get("usuario_id")


def identidad(token, caso, rol):

    estado, respuesta = peticion(
        "GET",
        "/auth/me",
        token=token
    )

    data = (respuesta or {}).get("data") or {}

    comprobar(
        caso,
        f"Identidad del servidor: {rol}",
        200,
        estado,
        data.get("rol") == rol
    )


def logout(token, caso, rol):

    estado, _ = peticion(
        "POST",
        "/auth/logout",
        token=token
    )

    comprobar(
        caso,
        f"Logout {rol}",
        200,
        estado
    )

    estado, _ = peticion(
        "GET",
        "/auth/me",
        token=token
    )

    comprobar(
        caso,
        f"Revocacion del token: {rol}",
        401,
        estado
    )

    if estado == 401:
        TOKENS.discard(token)


try:

    print("\n===== LOGIN DE LOS TRES ROLES =====\n")

    candidato, candidato_id = login(
        "candidato", "QA05-W01"
    )

    empresa, empresa_id = login(
        "empresa", "QA05-W02"
    )

    admin, admin_id = login(
        "admin", "QA05-W03"
    )

    identidad(candidato, "QA05-W01", "candidato")
    identidad(empresa, "QA05-W02", "empresa")
    identidad(admin, "QA05-W03", "admin")

    print("\n===== PERFILES =====\n")

    estado, _ = peticion(
        "GET",
        "/candidatos/me",
        token=candidato
    )

    comprobar(
        "QA05-W01", "Perfil candidato", 200, estado
    )

    estado, _ = peticion(
        "GET",
        "/empresas/me",
        token=empresa
    )

    comprobar(
        "QA05-W02", "Perfil empresa", 200, estado
    )

    print("\n===== PERSISTENCIA DE TOKEN =====\n")

    identidad(candidato, "QA05-W04", "candidato")
    identidad(empresa, "QA05-W04", "empresa")
    identidad(admin, "QA05-W04", "admin")

    print("\n===== TOKEN INVALIDO =====\n")

    estado, _ = peticion(
        "GET",
        "/auth/me",
        token="token-invalido-qa05"
    )

    comprobar(
        "QA05-W05", "Token invalido", 401, estado
    )

    print("\n===== CUENTA SUSPENDIDA =====\n")

    estado, respuesta = peticion(
        "POST",
        "/auth/login",
        {
            "correo": CUENTAS["suspendido"],
            "password": PASSWORD
        }
    )

    data = (respuesta or {}).get("data") or {}

    if data.get("token"):
        TOKENS.add(data["token"])

    mensaje = (respuesta or {}).get("message", "")

    comprobar(
        "QA05-W06",
        "Rechazo de cuenta suspendida",
        403,
        estado,
        isinstance(mensaje, str)
        and "suspendida" in mensaje.lower()
        and not data.get("token")
    )

    print("\n===== AUTORIZACION POR ROLES =====\n")

    restricciones = [
        (
            candidato,
            "/empresas/me",
            "Candidato accede a perfil empresa"
        ),
        (
            empresa,
            "/candidatos/me",
            "Empresa accede a perfil candidato"
        ),
        (
            candidato,
            "/empresas/me/vacantes",
            "Candidato consulta vacantes privadas"
        ),
        (
            admin,
            "/candidatos/me",
            "Admin accede a ruta exclusiva candidato"
        ),
        (
            admin,
            "/empresas/me",
            "Admin accede a ruta exclusiva empresa"
        )
    ]

    for token, ruta, descripcion in restricciones:

        estado, _ = peticion(
            "GET", ruta, token=token
        )

        comprobar(
            "QA05-W07",
            descripcion,
            403,
            estado
        )

    print("\n===== LOGOUT DE LOS TRES ROLES =====\n")

    logout(candidato, "QA05-W08", "candidato")
    logout(empresa, "QA05-W09", "empresa")
    logout(admin, "QA05-W10", "admin")

finally:

    for token in list(TOKENS):

        try:
            estado, _ = peticion(
                "POST",
                "/auth/logout",
                token=token
            )

            if estado not in (200, 401):
                print(
                    "ADVERTENCIA: limpieza de "
                    f"sesion devolvio HTTP {estado}"
                )

        except Exception:
            print(
                "ADVERTENCIA: no se pudo "
                "completar una limpieza de sesion"
            )

    destino = (
        Path.home()
        / "projects"
        / "qa-backups"
        / "QA-05"
        / "frontend"
    )

    destino.mkdir(parents=True, exist_ok=True)

    aprobados = sum(
        r["resultado"] == "PASS"
        for r in RESULTADOS
    )

    fallidos = sum(
        r["resultado"] == "FAIL"
        for r in RESULTADOS
    )

    reporte = {
        "fecha": datetime.now().astimezone().isoformat(),
        "tipo": "Regresion HTTP mediante proxy Angular QA",
        "total": len(RESULTADOS),
        "aprobados": aprobados,
        "fallidos": fallidos,
        "resultados": RESULTADOS
    }

    archivo = destino / "regresion-http.json"

    archivo.write_text(
        json.dumps(
            reporte,
            indent=2,
            ensure_ascii=False
        )
    )

    print("\n===== RESUMEN =====")
    print("Total:", len(RESULTADOS))
    print("PASS:", aprobados)
    print("FAIL:", fallidos)
    print("Reporte:", archivo)

if fallidos:
    raise SystemExit(1)

