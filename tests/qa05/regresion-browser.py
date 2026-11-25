import getpass
import json
import re
import sys

from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = "http://127.0.0.1:4201"
API = BASE + "/api/v1"

DESTINO = (
    Path.home()
    / "projects/qa-backups/QA-05/frontend/browser"
)

DESTINO.mkdir(parents=True, exist_ok=True)

PASSWORD = getpass.getpass("Contraseña QA_FIXTURE_PASSWORD: ")

CUENTAS = {
    "candidato": "candidato1@qa.example.test",
    "empresa": "empresa1@qa.example.test",
    "admin": "admin@qa.example.test",
    "suspendido": "suspendido@qa.example.test",
    "objetivo": "candidato2@qa.example.test"
}

RUTAS = {
    "candidato": "/creo/candidate-profile",
    "empresa": "/creo/company-home",
    "admin": "/creo/admin-dashboard"
}

RESULTADOS = []
TOKENS = set()

if input(
    "¿Entorno QA aislado y candidato2 disponible? [si/no]: "
).strip().lower() != "si":
    sys.exit("Ejecución cancelada.")


def registrar(caso, descripcion, resultado, detalle=""):
    RESULTADOS.append({
        "caso": caso,
        "descripcion": descripcion,
        "resultado": resultado,
        "detalle": detalle
    })

    print(f"[{resultado}] {caso}: {descripcion} {detalle}")


def comprobar(condicion, mensaje):
    if not condicion:
        raise AssertionError(mensaje)


def captura(page, nombre):

    # Ocultar credenciales si el formulario sigue visible.
    mascaras = [
        page.locator('input[type="password"]'),
    ]

    page.screenshot(
        path=str(DESTINO / f"{nombre}.png"),
        full_page=True,
        mask=mascaras
    )


def token_actual(page):
    return page.evaluate(
        "() => sessionStorage.getItem('token')"
    )


def rol_actual(page):
    return page.evaluate("""
        () => {
            const raw = sessionStorage.getItem('creo_user');
            return raw ? JSON.parse(raw).rol : null;
        }
    """)


def verificar_sesion_limpia(page):
    expect.poll if False else None

    page.wait_for_function("""
        () => (
            sessionStorage.getItem('token') === null &&
            sessionStorage.getItem('creo_user') === null
        )
    """)


def respuesta_api(context, metodo, ruta, token, datos=None):

    opciones = {
        "method": metodo,
        "headers": {
            "Accept": "application/json",
            "Authorization": f"Bearer {token}"
        },
        "timeout": 15000
    }

    if datos is not None:
        opciones["data"] = datos

    respuesta = context.request.fetch(
        API + ruta,
        **opciones
    )

    return respuesta


def login(page, rol, esperado=200, correo=None):

    page.goto(BASE + "/creo/landing")

    page.locator('input[type="email"]').fill(
        correo or CUENTAS[rol]
    )

    page.locator('input[type="password"]').fill(
        PASSWORD
    )

    with page.expect_response(
        lambda r: (
            r.url == API + "/auth/login"
            and r.request.method == "POST"
        )
    ) as evento:

        page.get_by_role(
            "button",
            name="Iniciar sesión",
            exact=True
        ).click()

    respuesta = evento.value

    comprobar(
        respuesta.status == esperado,
        f"Login: esperado {esperado}, recibido {respuesta.status}"
    )

    if esperado == 200:

        datos = respuesta.json()["data"]

        TOKENS.add(datos["token"])

        expect(page).to_have_url(
            re.compile(re.escape(RUTAS[rol]) + r"(\?.*)?$")
        )

        comprobar(
            rol_actual(page) == rol,
            "Rol almacenado incorrecto"
        )

        comprobar(
            bool(token_actual(page)),
            "No se guardó token"
        )

        comprobar(
            token_actual(page) == datos["token"],
            "Token de sesión diferente al emitido"
        )

        return datos

    verificar_sesion_limpia(page)

    return respuesta.json()


def abrir_perfil_candidato(page):

    with page.expect_response(
        lambda r: (
            r.url == API + "/candidatos/me"
            and r.request.method == "GET"
        )
    ) as evento:

        page.goto(BASE + RUTAS["candidato"])

    comprobar(
        evento.value.status == 200,
        "No se pudo recuperar perfil del candidato"
    )


def verificar_identidad(page, rol):

    respuesta = respuesta_api(
        page.context,
        "GET",
        "/auth/me",
        token_actual(page)
    )

    comprobar(
        respuesta.status == 200,
        "Token de sesión no reconocido por Laravel"
    )

    comprobar(
        respuesta.json()["data"]["rol"] == rol,
        "Rol del servidor incorrecto"
    )


def logout(page, rol):

    token = token_actual(page)

    comprobar(bool(token), "No existe sesión para cerrar")

    if rol == "admin":
        boton = page.get_by_role(
            "button", name="Salir", exact=True
        )
    else:
        # Selector derivado del menú Avatar del HTML.
        avatar = page.locator(
            "button"
        ).filter(
            has=page.locator(
                'svg path[d="M6 9l6 6 6-6"]'
            )
        )

        expect(avatar).to_have_count(1)
        avatar.click()

        boton = page.get_by_role(
            "button", name="Cerrar sesión", exact=True
        )

    with page.expect_response(
        lambda r: (
            r.url == API + "/auth/logout"
            and r.request.method == "POST"
        )
    ) as evento:

        boton.click()

    comprobar(
        evento.value.status == 200,
        "Logout no devolvió HTTP 200"
    )

    expect(page).to_have_url(
        re.compile(r"/creo/landing(?:\?.*)?$")
    )

    verificar_sesion_limpia(page)

    respuesta = respuesta_api(
        page.context,
        "GET",
        "/auth/me",
        token
    )

    comprobar(
        respuesta.status == 401,
        "El token anterior no fue revocado"
    )

    TOKENS.discard(token)

    page.goto(BASE + RUTAS[rol])

    expect(page).to_have_url(
        re.compile(r"/creo/landing(?:\?.*)?$")
    )


def ejecutar(caso, descripcion, page, funcion):
    try:

        funcion()

        captura(page, caso)

        registrar(caso, descripcion, "PASS")

        return True

    except AssertionError as error:

        captura(page, caso + "-FAIL")

        registrar(
            caso, descripcion, "FAIL",
            str(error)
        )

        return False

    except Exception as error:

        registrar(
            caso,
            descripcion,
            "FAIL",
            type(error).__name__
        )

        try:
            captura(page, caso + "-FAIL")
        except Exception:
            pass

        return False


with sync_playwright() as p:

    browser = p.chromium.launch(headless=True)

    def nuevo_contexto():
        contexto = browser.new_context(
            viewport={"width": 1440, "height": 900}
        )

        contexto.set_default_timeout(15000)

        return contexto

    contextos = {
        rol: nuevo_contexto()
        for rol in ["candidato", "empresa", "admin"]
    }

    paginas = {
        rol: contexto.new_page()
        for rol, contexto in contextos.items()
    }

    candidato = paginas["candidato"]
    empresa = paginas["empresa"]
    admin = paginas["admin"]

    contexto_aux = nuevo_contexto()
    auxiliar = contexto_aux.new_page()

    contexto_objetivo = nuevo_contexto()
    objetivo = contexto_objetivo.new_page()

    objetivo_id = None
    token_admin = None
    suspension_intentada = False
    restauracion_ok = True

    try:

        print("\n===== LOGIN =====")

        def prueba_login(rol):
            page = paginas[rol]

            login(page, rol)
            verificar_identidad(page, rol)

            if rol == "candidato":
                abrir_perfil_candidato(page)

            if rol == "empresa":
                respuesta = respuesta_api(
                    page.context,
                    "GET",
                    "/empresas/me",
                    token_actual(page)
                )

                comprobar(
                    respuesta.status == 200,
                    "Perfil empresa inaccesible"
                )

        for caso, rol in [
            ("W01", "candidato"),
            ("W02", "empresa"),
            ("W03", "admin")
        ]:

            ejecutar(
                caso,
                "Login " + rol,
                paginas[rol],
                lambda rol=rol: prueba_login(rol)
            )

        print("\n===== RECARGA =====")

        def prueba_recarga():

            for rol, page in paginas.items():

                anterior = token_actual(page)

                comprobar(
                    bool(anterior),
                    "Sesión previa inexistente"
                )

                page.reload()

                expect(page).to_have_url(
                    re.compile(re.escape(RUTAS[rol]))
                )

                comprobar(
                    token_actual(page) == anterior,
                    f"Sesión perdida para {rol}"
                )

                comprobar(
                    rol_actual(page) == rol,
                    "Rol perdido tras recarga"
                )

                verificar_identidad(page, rol)

        ejecutar(
            "W04", "Recarga conserva sesiones",
            candidato, prueba_recarga
        )

        print("\n===== TOKEN INVALIDO =====")

        def prueba_token_invalido():

            login(auxiliar, "candidato")

            auxiliar.evaluate("""
                () => sessionStorage.setItem(
                    'token', 'token-invalido-qa05'
                )
            """)

            with auxiliar.expect_response(
                lambda r: (
                    r.url == API + "/candidatos/me"
                    and r.status == 401
                )
            ):
                auxiliar.reload()

            expect(auxiliar).to_have_url(
                re.compile(r"sessionExpired=true")
            )

            verificar_sesion_limpia(auxiliar)

            expect(auxiliar.get_by_text(
                "Tu sesión expiró. Inicia sesión nuevamente.",
                exact=True
            )).to_be_visible()

        ejecutar(
            "W05", "Token invalido",
            auxiliar, prueba_token_invalido
        )

        print("\n===== CUENTA SUSPENDIDA =====")

        def prueba_suspendido():

            login(
                auxiliar,
                "suspendido",
                esperado=403
            )

            expect(auxiliar.get_by_text(
                "Su cuenta se encuentra suspendida. "
                "Comuníquese con el administrador.",
                exact=True
            )).to_be_visible()

            expect(auxiliar).to_have_url(
                re.compile(r"/creo/landing")
            )

        ejecutar(
            "W06", "Cuenta suspendida",
            auxiliar, prueba_suspendido
        )

        print("\n===== GUARDS =====")

        def prueba_guards():

            for rol, page in paginas.items():

                comprobar(
                    bool(token_actual(page)),
                    f"Falta sesión de {rol}"
                )

                anterior = token_actual(page)

                for rol_ajeno, ruta in RUTAS.items():

                    if rol_ajeno == rol:
                        continue

                    page.goto(BASE + ruta)

                    expect(page).to_have_url(
                        re.compile(r"/creo/landing")
                    )

                    comprobar(
                        token_actual(page) == anterior,
                        "Guard eliminó sesión válida"
                    )

                page.goto(BASE + RUTAS[rol])

                expect(page).to_have_url(
                    re.compile(re.escape(RUTAS[rol]))
                )

            verificar_sesion_limpia(auxiliar)

            auxiliar.goto(BASE + RUTAS["admin"])

            expect(auxiliar).to_have_url(
                re.compile(r"/creo/landing")
            )

        ejecutar(
            "W07", "Navegacion restringida por roles",
            candidato, prueba_guards
        )

        print("\n===== LOGOUT =====")

        for caso, rol in [
            ("W08", "candidato"),
            ("W09", "empresa"),
            ("W10", "admin")
        ]:

            ejecutar(
                caso,
                "Logout y revocacion " + rol,
                paginas[rol],
                lambda rol=rol: logout(
                    paginas[rol], rol
                )
            )

        print("\n===== SUSPENSION Y REACTIVACION =====")

        def preparar_objetivo():

            global objetivo_id, token_admin

            datos = login(
                objetivo,
                "candidato",
                correo=CUENTAS["objetivo"]
            )

            objetivo_id = datos["usuario_id"]

            login(admin, "admin")

            token_admin = token_actual(admin)

            comprobar(
                datos["correo"] == CUENTAS["objetivo"],
                "Cuenta objetivo incorrecta"
            )

            admin.goto(BASE + "/creo/admin-accounts")

            admin.get_by_placeholder(
                "Buscar por nombre o correo..."
            ).fill(CUENTAS["objetivo"])

            fila = admin.get_by_role("row").filter(
                has=admin.get_by_text(
                    CUENTAS["objetivo"], exact=True
                )
            )

            expect(fila).to_have_count(1)

            expect(fila.get_by_text(
                "Activo", exact=True
            )).to_be_visible()

            return fila

        def prueba_suspension():

            global suspension_intentada

            fila = preparar_objetivo()

            fila.get_by_role(
                "button", name="Suspender", exact=True
            ).click()

            expect(admin.get_by_role(
                "heading", name="Suspender cuenta"
            )).to_be_visible()

            textarea = admin.locator("textarea:visible")

            expect(textarea).to_have_count(1)

            textarea.fill(
                "Regresion funcional automatizada QA05-W11"
            )

            suspension_intentada = True

            with admin.expect_response(
                lambda r: (
                    r.url == API
                    + f"/admin/usuarios/{objetivo_id}/suspender"
                    and r.request.method == "PATCH"
                )
            ) as evento:

                admin.get_by_role(
                    "button",
                    name="Suspender",
                    exact=True
                ).last.click()

            comprobar(
                evento.value.status == 200,
                "Suspension no aprobada"
            )

            expect(fila.get_by_text(
                "Suspendido", exact=True
            )).to_be_visible()

            captura(admin, "W11-admin")

            with objetivo.expect_response(
                lambda r: (
                    r.url == API + "/candidatos/me"
                    and r.status == 401
                )
            ):
                objetivo.reload()

            expect(objetivo).to_have_url(
                re.compile(r"sessionExpired=true")
            )

            verificar_sesion_limpia(objetivo)

            captura(objetivo, "W11-candidato")

            comprobar(
                token_actual(admin) == token_admin,
                "Administrador perdió su sesión"
            )

            verificar_identidad(admin, "admin")

        suspension_ok = ejecutar(
            "W11", "Suspension y aislamiento admin",
            admin, prueba_suspension
        )

        def prueba_reactivacion():

            global suspension_intentada

            fila = admin.get_by_role("row").filter(
                has=admin.get_by_text(
                    CUENTAS["objetivo"], exact=True
                )
            )

            with admin.expect_response(
                lambda r: (
                    r.url == API
                    + f"/admin/usuarios/{objetivo_id}/reactivar"
                    and r.request.method == "PATCH"
                )
            ) as evento:

                fila.get_by_role(
                    "button",
                    name="Reactivar",
                    exact=True
                ).click()

            comprobar(
                evento.value.status == 200,
                "Reactivacion no aprobada"
            )

            expect(fila.get_by_text(
                "Activo", exact=True
            )).to_be_visible()

            suspension_intentada = False

            login(
                objetivo,
                "candidato",
                correo=CUENTAS["objetivo"]
            )

            verificar_identidad(objetivo, "candidato")

            abrir_perfil_candidato(objetivo)

        if suspension_ok:

            ejecutar(
                "W12", "Reactivacion y nuevo login",
                objetivo, prueba_reactivacion
            )

        else:

            registrar(
                "W12",
                "Reactivacion y nuevo login",
                "BLOQUEADO",
                "W11 no completado"
            )

    finally:

        print("\n===== LIMPIEZA =====")

        if suspension_intentada and objetivo_id:

            try:

                respuesta = respuesta_api(
                    contextos["admin"],
                    "PATCH",
                    f"/admin/usuarios/{objetivo_id}/reactivar",
                    token_admin
                )

                restauracion_ok = respuesta.status == 200

            except Exception:
                restauracion_ok = False

            print(
                "Restauracion de candidato2:",
                "PASS" if restauracion_ok else "FAIL"
            )

        tokens_no_revocados = 0

        for token in TOKENS:

            try:

                respuesta = respuesta_api(
                    contexto_aux,
                    "POST",
                    "/auth/logout",
                    token
                )

                if respuesta.status not in (200, 401):
                    tokens_no_revocados += 1

            except Exception:
                tokens_no_revocados += 1

        print(
            "Tokens pendientes de revocacion:",
            tokens_no_revocados
        )

        aprobados = sum(
            r["resultado"] == "PASS"
            for r in RESULTADOS
        )

        fallidos = sum(
            r["resultado"] == "FAIL"
            for r in RESULTADOS
        )

        bloqueados = sum(
            r["resultado"] == "BLOQUEADO"
            for r in RESULTADOS
        )

        reporte = {
            "fecha": datetime.now().astimezone().isoformat(),
            "herramienta": "Playwright Chromium headless",
            "chromium": browser.version,
            "esperados": 12,
            "ejecutados": len(RESULTADOS),
            "aprobados": aprobados,
            "fallidos": fallidos,
            "bloqueados": bloqueados,
            "restauracion_cuenta": restauracion_ok,
            "tokens_pendientes": tokens_no_revocados,
            "resultados": RESULTADOS
        }

        archivo = DESTINO / "resultados-browser.json"

        archivo.write_text(
            json.dumps(
                reporte,
                indent=2,
                ensure_ascii=False
            )
        )

        browser.close()

        print("\n===== RESULTADOS FINALES =====")
        print("PASS:", aprobados)
        print("FAIL:", fallidos)
        print("BLOQUEADOS:", bloqueados)
        print("Reporte:", archivo)

        if not restauracion_ok:
            print(
                "ATENCION: verificar manualmente "
                "el estado de candidato2."
            )

        if (
            aprobados != 12
            or not restauracion_ok
            or tokens_no_revocados
        ):
            sys.exit(1)

        print("PASS: Regresion funcional QA-05 completa.")

