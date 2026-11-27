#!/usr/bin/env python3

import json
import os
import sys

from pathlib import Path

from fixtures import (
    fixture,
    registrar,
    login,
    api,
    limpiar,
    RUN_ID,
    PASSWORD
)


def preparar():

    empresa = registrar("empresa")

    admin = fixture(
        "fixture-qa15.php",
        "crear_admin",
        password=PASSWORD
    )

    candidato_a = registrar("candidato")

    candidato_b = registrar("candidato")

    datos = fixture(
        "fixture-qa16.php",
        "datos_vacante"
    )["datos"]

    empresa_token = login(empresa["correo"])

    pendiente = api(
        "POST",
        "/empresas/me/vacantes",
        datos,
        token=empresa_token,
        esperado=201
    )

    vacante_id = pendiente["id"]

    db = fixture(
        "fixture-qa16.php",
        "consultar_vacante",
        vacante_id=vacante_id
    )

    assert db["empresa_id"] == empresa["id"]

    assert db["postulaciones"] == 0

    assert db["revisiones"] == []

    assert db["pagos"] == []

    datos_rechazo = fixture(
        "fixture-qa16.php",
        "datos_vacante"
    )["datos"]

    vacante_rechazo = api(
        "POST",
        "/empresas/me/vacantes",
        datos_rechazo,
        token=empresa_token,
        esperado=201
    )

    assert vacante_rechazo["id"] != vacante_id

    db_rechazo = fixture(
        "fixture-qa16.php",
        "consultar_vacante",
        vacante_id=vacante_rechazo["id"]
    )

    assert db_rechazo["revisiones"] == []
    assert db_rechazo["pagos"] == []

    datos_pago = fixture(
        "fixture-qa16.php",
        "datos_vacante"
    )["datos"]

    vacante_pago = api(
        "POST",
        "/empresas/me/vacantes",
        datos_pago,
        token=empresa_token,
        esperado=201
    )

    admin_token = login(admin["correo"])

    api(
        "PATCH",
        f"/admin/vacantes/{vacante_pago['id']}/aprobar",
        {},
        token=admin_token
    )

    db_pago = fixture(
        "fixture-qa16.php",
        "consultar_vacante",
        vacante_id=vacante_pago["id"]
    )

    assert len(db_pago["revisiones"]) == 1
    assert db_pago["pagos"] == []
    assert db_pago["postulaciones"] == 0

    datos_kanban = fixture(
        "fixture-qa16.php",
        "datos_vacante"
    )["datos"]

    vacante_kanban = api(
        "POST",
        "/empresas/me/vacantes",
        datos_kanban,
        token=empresa_token,
        esperado=201
    )

    kanban_id = vacante_kanban["id"]

    api(
        "PATCH",
        f"/admin/vacantes/{kanban_id}/aprobar",
        {},
        token=admin_token
    )

    pago_kanban = fixture(
        "fixture-qa16.php",
        "datos_pago"
    )["datos"]

    api(
        "POST",
        f"/empresas/me/vacantes/{kanban_id}/pago",
        pago_kanban,
        token=empresa_token,
        esperado=201
    )

    postulaciones = {}

    for letra, candidato in (
        ("A", candidato_a),
        ("B", candidato_b)
    ):

        token_candidato = login(candidato["correo"])

        nombre = "Candidato Alfa" if letra == "A" else "Candidato Beta"

        api(
            "PUT",
            "/candidatos/me",
            {"nombre": nombre},
            token=token_candidato
        )

        postulacion = api(
            "POST",
            "/candidatos/me/postulaciones",
            {"vacante_id": kanban_id},
            token=token_candidato,
            esperado=201
        )

        db_post = fixture(
            "fixture-qa16.php",
            "consultar_postulacion",
            postulacion_id=postulacion["id"]
        )

        assert db_post["candidato_id"] == candidato["id"]
        assert db_post["empleo_id"] == kanban_id
        assert db_post["estado_nombre"] == "Recibido"
        assert db_post["historial"] == []

        postulaciones[letra] = {
            "id": postulacion["id"],
            "nombre": nombre + " Ficticio QA15"
        }

    assert postulaciones["A"]["id"] != postulaciones["B"]["id"]

    perfil = api(
        "GET",
        f"/empresas/me/postulaciones/{postulaciones['A']['id']}/perfil",
        token=empresa_token
    )

    assert any(
        estudio["carrera"] is None
        and estudio["institucion"] is None
        and estudio["estado"] is None
        for estudio in perfil["estudios"]
    ), "No se reproduce la precondicion de INC-QA20-01"

    print("PASS: Precondicion del defecto reproducida")

    def estructura(valor):

        if isinstance(valor, dict):

            return {
                k: estructura(v)
                for k, v in valor.items()
            }

        if isinstance(valor, list):

            return {
                "tipo": "array",
                "cantidad": len(valor),
                "elemento": estructura(valor[0])
                    if valor else None
            }

        return type(valor).__name__

    print(
        "PERFIL-DIAG: "
        + json.dumps(
            estructura(perfil),
            ensure_ascii=False
        )
    )


    print("PASS: Vacante Kanban publicada")
    print("PASS: Dos postulaciones independientes preparadas")

    datos_conflicto = fixture(
        "fixture-qa16.php",
        "datos_vacante"
    )["datos"]

    datos_conflicto["max_contrataciones"] = 1

    vacante_conflicto = api(
        "POST",
        "/empresas/me/vacantes",
        datos_conflicto,
        token=empresa_token,
        esperado=201
    )

    conflicto_id = vacante_conflicto["id"]

    api(
        "PATCH",
        f"/admin/vacantes/{conflicto_id}/aprobar",
        {},
        token=admin_token
    )

    api(
        "POST",
        f"/empresas/me/vacantes/{conflicto_id}/pago",
        fixture(
            "fixture-qa16.php",
            "datos_pago"
        )["datos"],
        token=empresa_token,
        esperado=201
    )

    conflicto_posts = {}

    for letra, candidato in (
        ("A", candidato_a),
        ("B", candidato_b)
    ):

        token_candidato = login(candidato["correo"])

        post = api(
            "POST",
            "/candidatos/me/postulaciones",
            {"vacante_id": conflicto_id},
            token=token_candidato,
            esperado=201
        )

        post_id = post["id"]

        ruta = (
            f"/empresas/me/vacantes/{conflicto_id}"
            f"/postulaciones/{post_id}"
        )

        for _ in range(2):

            api(
                "PATCH",
                ruta + "/avanzar",
                {},
                token=empresa_token
            )

        db_post = fixture(
            "fixture-qa16.php",
            "consultar_postulacion",
            postulacion_id=post_id
        )

        assert db_post["estado_nombre"] == "Entrevista"
        assert len(db_post["historial"]) == 2

        conflicto_posts[letra] = post_id

    print("PASS: Vacante con un cupo y dos candidatos en entrevista")

    resultado = {
        "run_id": RUN_ID,
        "empresa": empresa,
        "admin": {
            "correo": admin["correo"]
        },
        "candidato_a": candidato_a,
        "candidato_b": candidato_b,
        "vacante": {
            "id": vacante_id,
            "titulo": datos["titulo"]
        },
        "vacante_rechazo": {
            "id": vacante_rechazo["id"],
            "titulo": datos_rechazo["titulo"]
        },
        "vacante_pago": {
            "id": vacante_pago["id"],
            "titulo": datos_pago["titulo"]
        },
        "vacante_kanban": {
            "id": kanban_id,
            "titulo": datos_kanban["titulo"]
        },
        "postulacion_a": postulaciones["A"],
        "postulacion_b": postulaciones["B"],
        "vacante_conflicto": {
            "id": conflicto_id,
            "titulo": datos_conflicto["titulo"]
        },
        "conflicto_a": {
            "id": conflicto_posts["A"]
        },
        "conflicto_b": {
            "id": conflicto_posts["B"]
        },
        "datos_vacante": datos
    }

    archivo = Path(
        os.environ["SELENIUM_FIXTURE_FILE"]
    )

    archivo.write_text(
        json.dumps(resultado, indent=2)
    )

    archivo.chmod(0o600)

    print("PASS: Empresa sintetica preparada")
    print("PASS: Administrador sintetico preparado")
    print("PASS: Dos candidatos sinteticos preparados")
    print("PASS: Vacante pendiente sin revision ni pago")


def verificar_moderacion(fase):

    assert fase in ("aprobada", "no_aprobada", "sin_motivo")

    datos = json.loads(
        Path(os.environ["SELENIUM_FIXTURE_FILE"]).read_text()
    )

    clave = (
        "vacante"
        if fase == "aprobada"
        else "vacante_rechazo"
    )

    vacante_id = datos[clave]["id"]

    token = login(datos["empresa"]["correo"])

    vacante = api(
        "GET",
        f"/empresas/me/vacantes/{vacante_id}",
        token=token
    )

    db = fixture(
        "fixture-qa16.php",
        "consultar_vacante",
        vacante_id=vacante_id
    )

    assert db["empresa_id"] == datos["empresa"]["id"]
    assert db["postulaciones"] == 0
    assert db["pagos"] == []

    assert vacante["estado"]["general"] != "publicada"

    if fase == "sin_motivo":

        assert vacante["estado"]["revision"] == "pendiente"
        assert db["revisiones"] == []

    else:

        assert vacante["estado"]["revision"] == fase
        assert len(db["revisiones"]) == 1

        if fase == "no_aprobada":

            assert db["revisiones"][0]["motivo"] == (
                "Vacante sintetica QA20: requisitos por corregir."
            )

    resultado = {
        "run_id": RUN_ID,
        "vacante_id": vacante_id,
        "fase": fase,
        "estado_api": vacante["estado"],
        "revisiones_mysql": db["revisiones"],
        "pagos_mysql": len(db["pagos"]),
        "postulaciones_mysql": db["postulaciones"],
        "resultado": "PASS"
    }

    destino = Path(
        os.environ["SELENIUM_FIXTURE_FILE"]
    ).parent / f"mysql-moderacion-{fase}.json"

    destino.write_text(
        json.dumps(resultado, indent=2) + "\n"
    )

    print(f"PASS: Moderacion verificada: {fase}")


def verificar_pago(fase):

    assert fase in (
        "pendiente",
        "postergado",
        "publicada",
        "persistida"
    )

    datos = json.loads(
        Path(os.environ["SELENIUM_FIXTURE_FILE"]).read_text()
    )

    vacante_id = datos["vacante_pago"]["id"]

    token = login(datos["empresa"]["correo"])

    vacante = api(
        "GET",
        f"/empresas/me/vacantes/{vacante_id}",
        token=token
    )

    db = fixture(
        "fixture-qa16.php",
        "consultar_vacante",
        vacante_id=vacante_id
    )

    assert db["empresa_id"] == datos["empresa"]["id"]
    assert len(db["revisiones"]) == 1
    assert db["postulaciones"] == 0

    assert vacante["estado"]["revision"] == "aprobada"

    resultado = {
        "run_id": RUN_ID,
        "vacante_id": vacante_id,
        "fase": fase,
        "estado_api": vacante["estado"],
        "cantidad_pagos": len(db["pagos"])
    }

    carpeta = Path(
        os.environ["SELENIUM_FIXTURE_FILE"]
    ).parent

    if fase in ("pendiente", "postergado"):

        assert db["pagos"] == []
        assert vacante["estado"]["general"] != "publicada"

    else:

        assert vacante["estado"]["general"] == "publicada"
        assert vacante["estado"]["pago"] == "pagado"

        assert len(db["pagos"]) == 1

        pago = db["pagos"][0]

        assert float(pago["monto"]) == 100.0
        assert pago["moneda"] == "PEN"
        assert str(pago["tarjeta_ultimos4"]) == "4242"

        resultado["pago_id"] = pago["id"]
        resultado["monto"] = float(pago["monto"])
        resultado["moneda"] = pago["moneda"]
        resultado["ultimos4"] = pago["tarjeta_ultimos4"]

        if fase == "persistida":

            anterior = json.loads(
                (carpeta / "mysql-pago-publicada.json").read_text()
            )

            assert resultado["pago_id"] == anterior["pago_id"]

    resultado["resultado"] = "PASS"

    (carpeta / f"mysql-pago-{fase}.json").write_text(
        json.dumps(resultado, indent=2) + "\n"
    )

    print(f"PASS: Pago verificado: {fase}")


def verificar_kanban(letra, fase, motivo=None):

    assert letra in ("A", "B")

    esperados = {
        "recibido": ("Recibido", []),
        "revision": ("En Revisión", ["En Revisión"]),
        "entrevista": (
            "Entrevista",
            ["En Revisión", "Entrevista"]
        ),
        "contratado": (
            "Contratado",
            ["En Revisión", "Entrevista", "Contratado"]
        ),
        "rechazado": (
            "Rechazado",
            ["En Revisión", "Rechazado"]
        )
    }

    estado, movimientos = esperados[fase]

    datos = json.loads(
        Path(os.environ["SELENIUM_FIXTURE_FILE"]).read_text()
    )

    candidato = datos["candidato_" + letra.lower()]

    postulacion_id = datos[
        "postulacion_" + letra.lower()
    ]["id"]

    vacante_id = datos["vacante_kanban"]["id"]

    db = fixture(
        "fixture-qa16.php",
        "consultar_postulacion",
        postulacion_id=postulacion_id
    )

    assert db["candidato_id"] == candidato["id"]
    assert db["empleo_id"] == vacante_id
    assert db["estado_nombre"] == estado
    assert db["retirada_en"] is None

    token_candidato = login(candidato["correo"])

    postulaciones = api(
        "GET",
        "/candidatos/me/postulaciones",
        token=token_candidato
    )

    actual = next(
        p for p in postulaciones
        if p["id"] == postulacion_id
    )

    assert actual["estado"]["nombre"] == estado
    assert actual["retirada"] is False

    token_empresa = login(datos["empresa"]["correo"])

    historial = api(
        "GET",
        f"/empresas/me/vacantes/{vacante_id}/postulaciones/historial",
        token=token_empresa
    )

    registro = next(
        p for p in historial["postulaciones"]
        if p["id"] == postulacion_id
    )

    assert registro["estado"]["nombre"] == estado

    estados_api = [
        m["estado"]["nombre"]
        for m in registro["movimientos"]
    ]

    assert estados_api == movimientos, estados_api

    estados_mysql = [
        m["estado_nombre"]
        for m in db["historial"]
    ]

    assert estados_mysql == movimientos, estados_mysql

    assert [
        m["id"] for m in db["historial"]
    ] == [
        m["id"] for m in registro["movimientos"]
    ]

    assert len(db["historial"]) == len(movimientos)

    if fase == "rechazado":

        assert motivo

        assert registro["movimientos"][-1]["motivo_rechazo"] == motivo

    resultado = {
        "run_id": RUN_ID,
        "candidato": letra,
        "postulacion_id": postulacion_id,
        "vacante_id": vacante_id,
        "estado_mysql": db["estado_nombre"],
        "estado_api_candidato": actual["estado"],
        "historial_mysql": db["historial"],
        "historial_api": registro["movimientos"],
        "resultado": "PASS"
    }

    destino = Path(
        os.environ["SELENIUM_FIXTURE_FILE"]
    ).parent / f"mysql-kanban-{letra}-{fase}.json"

    destino.write_text(
        json.dumps(resultado, indent=2, ensure_ascii=False) + "\n"
    )

    print(f"PASS: Kanban {letra} - {fase}")


def verificar_conflicto(fase):

    assert fase in ("inicial", "contratacion", "bloqueado")

    datos = json.loads(
        Path(os.environ["SELENIUM_FIXTURE_FILE"]).read_text()
    )

    vacante_id = datos["vacante_conflicto"]["id"]

    alfa = fixture(
        "fixture-qa16.php",
        "consultar_postulacion",
        postulacion_id=datos["conflicto_a"]["id"]
    )

    beta = fixture(
        "fixture-qa16.php",
        "consultar_postulacion",
        postulacion_id=datos["conflicto_b"]["id"]
    )

    assert alfa["empleo_id"] == vacante_id
    assert beta["empleo_id"] == vacante_id

    assert alfa["candidato_id"] == datos["candidato_a"]["id"]
    assert beta["candidato_id"] == datos["candidato_b"]["id"]

    assert alfa["retirada_en"] is None
    assert beta["retirada_en"] is None

    assert beta["estado_nombre"] == "Entrevista"

    assert [
        m["estado_nombre"]
        for m in beta["historial"]
    ] == ["En Revisión", "Entrevista"]

    if fase == "inicial":

        assert alfa["estado_nombre"] == "Entrevista"

        assert [
            m["estado_nombre"]
            for m in alfa["historial"]
        ] == ["En Revisión", "Entrevista"]

        contratados = 0

    else:

        assert alfa["estado_nombre"] == "Contratado"

        assert [
            m["estado_nombre"]
            for m in alfa["historial"]
        ] == ["En Revisión", "Entrevista", "Contratado"]

        contratados = 1

    token = login(datos["empresa"]["correo"])

    historial = api(
        "GET",
        f"/empresas/me/vacantes/{vacante_id}/postulaciones/historial",
        token=token
    )

    assert historial["vacante"]["max_contrataciones"] == 1
    assert historial["vacante"]["contratados"] == contratados

    assert historial["vacante"]["cupos_disponibles"] == (
        1 - contratados
    )

    registros = {
        p["id"]: p
        for p in historial["postulaciones"]
    }

    assert set(registros) == {alfa["id"], beta["id"]}

    for db in (alfa, beta):

        actual = registros[db["id"]]

        assert actual["estado"]["nombre"] == db["estado_nombre"]

        assert [
            m["id"] for m in actual["movimientos"]
        ] == [
            m["id"] for m in db["historial"]
        ]

        assert [
            m["estado"]["nombre"]
            for m in actual["movimientos"]
        ] == [
            m["estado_nombre"]
            for m in db["historial"]
        ]

    resultado = {
        "run_id": RUN_ID,
        "fase": fase,
        "vacante_id": vacante_id,
        "max_contrataciones": 1,
        "contratados": contratados,
        "cupos_disponibles": 1 - contratados,
        "alfa": alfa,
        "beta": beta,
        "resultado": "PASS"
    }

    carpeta = Path(
        os.environ["SELENIUM_FIXTURE_FILE"]
    ).parent

    if fase == "bloqueado":

        anterior = json.loads(
            (carpeta / "mysql-conflicto-contratacion.json").read_text()
        )

        for candidato in ("alfa", "beta"):

            assert resultado[candidato]["estado_nombre"] == (
                anterior[candidato]["estado_nombre"]
            )

            assert resultado[candidato]["historial"] == (
                anterior[candidato]["historial"]
            )

    (carpeta / f"mysql-conflicto-{fase}.json").write_text(
        json.dumps(resultado, indent=2, ensure_ascii=False)
        + chr(10)
    )

    print(f"PASS: Conflicto de contratacion - {fase}")


if __name__ == "__main__":

    accion = sys.argv[1]

    if accion == "preparar":
        preparar()

    elif accion == "verificar-moderacion":
        verificar_moderacion(sys.argv[2])

    elif accion == "verificar-pago":
        verificar_pago(sys.argv[2])

    elif accion == "verificar-kanban":
        verificar_kanban(*sys.argv[2:])

    elif accion == "verificar-conflicto":
        verificar_conflicto(sys.argv[2])

    elif accion == "limpiar":
        limpiar()

    else:
        raise SystemExit("Accion no autorizada")
