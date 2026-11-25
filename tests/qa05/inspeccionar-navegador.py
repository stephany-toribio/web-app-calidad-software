from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:4201"

DESTINO = (
    Path.home()
    / "projects"
    / "qa-backups"
    / "QA-05"
    / "frontend"
    / "browser"
)

DESTINO.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    context = browser.new_context(
        viewport={"width": 1440, "height": 900}
    )

    page = context.new_page()

    respuesta = page.goto(
        BASE + "/creo/landing",
        wait_until="domcontentloaded"
    )

    page.locator("body").wait_for(state="visible")

    page.locator("button, input, a").first.wait_for(
        state="attached",
        timeout=15000
    )

    print("===== DISPONIBILIDAD =====")
    print("HTTP:", respuesta.status if respuesta else None)
    print("URL:", page.url)
    print("Titulo:", page.title())

    print("\n===== INPUTS =====")

    for campo in page.locator("input").all():
        print({
            "type": campo.get_attribute("type"),
            "name": campo.get_attribute("name"),
            "id": campo.get_attribute("id"),
            "placeholder": campo.get_attribute("placeholder"),
            "visible": campo.is_visible()
        })

    print("\n===== BOTONES =====")

    for boton in page.locator("button").all():
        print({
            "texto": boton.inner_text().strip(),
            "type": boton.get_attribute("type"),
            "id": boton.get_attribute("id"),
            "visible": boton.is_visible()
        })

    print("\n===== ENLACES =====")

    for enlace in page.locator("a").all():
        print({
            "texto": enlace.inner_text().strip(),
            "href": enlace.get_attribute("href")
        })

    archivo = DESTINO / "landing-inicial.png"

    page.screenshot(
        path=str(archivo),
        full_page=True
    )

    print("\nCaptura:", archivo)

    assert respuesta is not None
    assert respuesta.status == 200

    context.close()
    browser.close()

    print("PASS: Navegador conectado al frontend QA.")
