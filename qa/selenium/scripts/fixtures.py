#!/usr/bin/env python3

import json
import os
import sys
import subprocess
import urllib.request
from pathlib import Path

BACKEND = Path(
    os.environ.get(
        "QA_BACKEND_DIR",
        str(Path.home() / "projects/recruitment-api-calidad-software")
    )
)

RUN_ID = os.environ["SELENIUM_RUN_ID"]
PASSWORD = os.environ["SELENIUM_FIXTURE_PASSWORD"]

API = "http://127.0.0.1:8002/api/v1"


def fixture(script, accion, **datos):

    entrada = {
        "run_id": RUN_ID,
        "accion": accion,
        **datos
    }

    proceso = subprocess.run(
        [
            "docker", "compose", "exec", "-T", "app",
            "php", f"qa/karate/scripts/{script}"
        ],
        cwd=BACKEND,
        input=json.dumps(entrada),
        text=True,
        capture_output=True,
        timeout=60
    )

    if proceso.returncode != 0:
        raise RuntimeError(
            f"Error en fixture backend: {accion}"
        )

    resultado = json.loads(proceso.stdout)

    assert resultado["success"] is True

    return resultado


def api(method, path, data=None, token=None, esperado=200):

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    if token:
        headers["Authorization"] = "Bearer " + token

    request = urllib.request.Request(
        API + path,
        data=json.dumps(data).encode() if data is not None else None,
        headers=headers,
        method=method
    )

    with urllib.request.urlopen(request, timeout=30) as respuesta:

        assert respuesta.status == esperado

        resultado = json.load(respuesta)

        assert resultado["success"] is True

        return resultado["data"]


def registrar(tipo):

    assert tipo in ("candidato", "empresa")

    datos = fixture(
        "fixture-qa15.php",
        "datos",
        tipo=tipo
    )["datos"]

    datos["password"] = PASSWORD

    if tipo == "candidato":
        datos["password_confirmation"] = PASSWORD

    correo = datos["correo"]

    creado = api(
        "POST",
        "/candidatos" if tipo == "candidato" else "/empresas",
        datos,
        esperado=201
    )

    assert creado["correo"] == correo
    assert isinstance(creado["id"], int)
    assert creado["id"] > 0

    resultado = {
        "correo": correo,
        "id": creado["id"]
    }

    if tipo == "candidato":
        resultado["usuario_id"] = creado["usuario_id"]

    return resultado


def login(correo):

    return api(
        "POST",
        "/auth/login",
        {
            "correo": correo,
            "password": PASSWORD
        }
    )["token"]


def publicar_vacante():

    empresa = registrar("empresa")

    empresa_token = login(empresa["correo"])

    admin = fixture(
        "fixture-qa15.php",
        "crear_admin",
        password=PASSWORD
    )

    admin_token = login(admin["correo"])

    datos = fixture(
        "fixture-qa16.php",
        "datos_vacante"
    )["datos"]

    creada = api(
        "POST",
        "/empresas/me/vacantes",
        datos,
        token=empresa_token,
        esperado=201
    )

    vacante_id = creada["id"]

    api(
        "PATCH",
        f"/admin/vacantes/{vacante_id}/aprobar",
        {},
        token=admin_token
    )

    pago = fixture(
        "fixture-qa16.php",
        "datos_pago"
    )["datos"]

    api(
        "POST",
        f"/empresas/me/vacantes/{vacante_id}/pago",
        pago,
        token=empresa_token,
        esperado=201
    )

    publicada = api(
        "GET",
        f"/empresas/me/vacantes/{vacante_id}",
        token=empresa_token
    )

    assert publicada["estado"]["general"] == "publicada"
    assert publicada["estado"]["pago"] == "pagado"
    assert publicada["estado"]["revision"] == "aprobada"

    db = fixture(
        "fixture-qa16.php",
        "consultar_vacante",
        vacante_id=vacante_id
    )

    assert db["postulaciones"] == 0

    print("PASS: Vacante sintetica publicada")

    return {
        "id": vacante_id,
        "titulo": datos["titulo"],
        "empresa_id": empresa["id"]
    }


def preparar():

    return {
        "run_id": RUN_ID,
        "candidato": registrar("candidato"),
        "candidato_negativo": registrar("candidato"),
        "candidato_negocio": registrar("candidato"),
        "vacante": publicar_vacante(),
        "registro": fixture(
            "fixture-qa15.php",
            "datos",
            tipo="candidato"
        )["datos"]
    }


def limpiar():

    resultado = fixture(
        "fixture-qa16.php",
        "limpiar"
    )

    assert resultado["restantes"] == 0

    for campo, cantidad in resultado["despues"].items():

        if campo != "success":
            assert cantidad == 0, campo

    print("PASS: Fixtures eliminados:", resultado["eliminados"])
    print("PASS: Fixtures restantes: 0")


def verificar_postulacion(fase):

    candidato_id = int(os.environ["SELENIUM_CANDIDATE_ID"])
    vacante_id = int(os.environ["SELENIUM_VACANCY_ID"])

    vacante = fixture(
        "fixture-qa16.php",
        "consultar_vacante",
        vacante_id=vacante_id
    )

    cantidades = fixture(
        "fixture-qa16.php",
        "cantidades"
    )

    resultado = {
        "run_id": RUN_ID,
        "fase": fase,
        "candidato_id": candidato_id,
        "vacante_id": vacante_id,
        "postulaciones": vacante["postulaciones"]
    }

    if fase == "cancelada":

        assert vacante["postulaciones"] == 0
        assert cantidades["postulaciones"] == 0

    else:

        assert fase in ("creada", "persistida", "retirada")
        assert vacante["postulaciones"] == 1
        assert cantidades["postulaciones"] == 1

        token = login(os.environ["SELENIUM_BUSINESS_EMAIL"])

        postulaciones = api(
            "GET",
            "/candidatos/me/postulaciones",
            token=token
        )

        assert isinstance(postulaciones, list)
        assert len(postulaciones) == 1

        postulacion = postulaciones[0]

        assert postulacion["vacante"]["id"] == vacante_id

        db = fixture(
            "fixture-qa16.php",
            "consultar_postulacion",
            postulacion_id=postulacion["id"]
        )

        assert db["candidato_id"] == candidato_id
        assert db["empleo_id"] == vacante_id
        assert db["estado_nombre"] == "Recibido"

        assert db["historial"] == []

        if fase == "retirada":

            assert db["retirada_en"] is not None
            assert postulacion["retirada"] is True
            assert postulacion["puede_retirar"] is False

        else:

            assert db["retirada_en"] is None
            assert postulacion["retirada"] is False

        resultado.update({
            "postulacion_id": db["id"],
            "estado": db["estado_nombre"],
            "retirada_en": db["retirada_en"],
            "historial": db["historial"]
        })

    evidencia = Path(
        os.environ["SELENIUM_FIXTURE_FILE"]
    ).parent / f"mysql-{fase}.json"

    if fase in ("persistida", "retirada"):

        anterior = json.loads(
            evidencia.with_name("mysql-creada.json").read_text()
        )

        assert resultado["postulacion_id"] == anterior["postulacion_id"]

    resultado["resultado"] = "PASS"

    evidencia.write_text(
        json.dumps(resultado, indent=2) + "\n"
    )

    print(f"PASS: MySQL postulacion {fase}")


def verificar_perfil(nombre):

    datos = json.loads(
        Path(os.environ["SELENIUM_FIXTURE_FILE"]).read_text()
    )

    candidato = datos["candidato"]

    db = fixture(
        "fixture-qa16.php",
        "consultar_candidato",
        candidato_id=candidato["id"]
    )

    assert int(db["perfil"]["id"]) == candidato["id"]

    assert db["perfil"]["nombre"] == nombre

    assert db["usuario"]["correo"] == candidato["correo"]

    evidencia = {
        "run_id": RUN_ID,
        "candidato_id": candidato["id"],
        "nombre_esperado": nombre,
        "nombre_persistido": db["perfil"]["nombre"],
        "correo_sin_cambios": True,
        "resultado": "PASS"
    }

    destino = Path(
        os.environ["SELENIUM_FIXTURE_FILE"]
    ).parent / "mysql-perfil.json"

    destino.write_text(
        json.dumps(evidencia, indent=2) + "\n"
    )

    print("PASS: Perfil persistido en MySQL")


def verificar_registro_no_creado():

    datos = json.loads(
        Path(os.environ["SELENIUM_FIXTURE_FILE"]).read_text()
    )

    correo = datos["registro"]["correo"]

    resultado = fixture(
        "fixture-qa15.php",
        "consultar",
        correo=correo
    )

    assert resultado["existe"] is False

    destino = Path(
        os.environ["SELENIUM_FIXTURE_FILE"]
    ).parent / "mysql-registro-no-creado.json"

    destino.write_text(json.dumps({
        "run_id": RUN_ID,
        "usuario_creado": False,
        "resultado": "PASS"
    }, indent=2) + "\n")

    print("PASS: Registro parcial no persistido")


if __name__ == "__main__":

    if sys.argv[1] == "preparar":

        resultado = preparar()

        destino = Path(os.environ["SELENIUM_FIXTURE_FILE"])

        destino.write_text(
            json.dumps(resultado, indent=2) + "\n"
        )

        destino.chmod(0o600)

        print("PASS: Candidatos sinteticos preparados")

    elif sys.argv[1] == "verificar-registro":

        verificar_registro_no_creado()

    elif sys.argv[1] == "verificar-perfil":

        verificar_perfil(sys.argv[2])

    elif sys.argv[1] == "verificar":

        verificar_postulacion(sys.argv[2])

    elif sys.argv[1] == "limpiar":

        limpiar()

    else:

        raise SystemExit("Accion no permitida")
