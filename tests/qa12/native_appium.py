"""Ejemplo de ejecución real; requiere Appium 2/3 + UiAutomator2, Appium-Python-Client y chromedriver compatible.
APK instalado, sesión de candidato abierta en Empleos. No se declara ejecutado por incluir este script.
APPIUM_URL por defecto http://127.0.0.1:4723. ANDROID_SERIAL selecciona el dispositivo.
"""
import os
from pathlib import Path
from appium import webdriver
from appium.options.android import UiAutomator2Options
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

out = Path('docs/evidencias/QA-12/appium'); out.mkdir(parents=True, exist_ok=True)
options = UiAutomator2Options().load_capabilities({
    'platformName': 'Android', 'appium:automationName': 'UiAutomator2',
    'appium:udid': os.environ.get('ANDROID_SERIAL', 'R52W402SX5T'),
    'appium:appPackage': 'edu.upch.creo.qa', 'appium:appActivity': '.MainActivity',
    'appium:noReset': True,
})
driver = webdriver.Remote(os.environ.get('APPIUM_URL', 'http://127.0.0.1:4723'), options=options)
wait = WebDriverWait(driver, 25)
def webview():
    context = wait.until(lambda d: next((c for c in d.contexts if c.startswith('WEBVIEW')), None))
    driver.switch_to.context(context)
def web(testid):
    return wait.until(lambda d: d.find_element(By.CSS_SELECTOR, f'[data-testid="{testid}"]'))
def native_choice():
    web('jobs-native-skills').click()
    driver.switch_to.context('NATIVE_APP')
    listing = wait.until(lambda d: d.find_element(AppiumBy.ID, 'edu.upch.creo.qa:id/qa12_skill_list'))
    bounds = listing.rect
    # A real swipe over a real Android ListView, then tap a visible native checkbox row.
    driver.execute_script('mobile: scrollGesture', {'left': bounds['x'], 'top': bounds['y'], 'width': bounds['width'], 'height': bounds['height'], 'direction': 'down', 'percent': 0.65})
    rows = listing.find_elements(AppiumBy.CLASS_NAME, 'android.widget.CheckedTextView')
    row = next(r for r in rows if r.is_displayed() and r.get_attribute('checked') == 'false')
    label = row.text
    driver.find_element(AppiumBy.ANDROID_UIAUTOMATOR,
        'new UiSelector().className("android.widget.CheckedTextView").text(' + __import__('json').dumps(label) + ')').click()
    return label
try:
    webview()
    before = web('jobs-native-selection').text
    assert int(before.split()[0]) <= 2, 'Dejar como máximo dos habilidades seleccionadas antes de ejecutar.'
    # Start with no more than two selected skills, so a third can be applied.
    label = native_choice()
    driver.save_screenshot(str(out / '01-lista-nativa.png'))
    (out / '01-arbol-nativo.xml').write_text(driver.page_source, encoding='utf-8')
    driver.find_element(AppiumBy.ID, 'android:id/button2').click()
    webview(); assert web('jobs-native-selection').text == before
    label = native_choice()
    driver.find_element(AppiumBy.ID, 'android:id/button1').click()
    webview()
    wait.until(lambda d: label in web('jobs-native-selection').text)
    driver.save_screenshot(str(out / '02-filtro-aplicado.png'))
    (out / 'resultado.txt').write_text('PASS: swipe y tap nativos; cancelar conserva selección; aplicar añade '+label+'\n', encoding='utf-8')
finally:
    driver.quit()
