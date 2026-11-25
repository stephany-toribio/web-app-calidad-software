package creo.tests;

import creo.support.BaseTest;
import creo.pages.LoginPage;
import creo.pages.AdminModerationPage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@Tag("company-admin")
class AdminModerationTest extends BaseTest {

    private String variable(String nombre) {

        String valor = System.getenv(nombre);

        assertNotNull(valor, nombre);
        assertFalse(valor.isBlank());

        return valor;
    }

    private AdminModerationPage abrirModeracion() {

        LoginPage login = new LoginPage(driver, wait);

        login.abrir(baseUrl);

        login.iniciarSesion(
            variable("SELENIUM_ADMIN_EMAIL"),
            variable("SELENIUM_FIXTURE_PASSWORD")
        );

        login.esperarDashboardAdmin();

        AdminModerationPage moderacion =
            new AdminModerationPage(driver, wait);

        moderacion.abrir(baseUrl);

        return moderacion;
    }

    private void captura(String nombre) throws Exception {

        Path directorio = Path.of(
            "target", "qa-evidence"
        );

        Files.createDirectories(directorio);

        Files.write(
            directorio.resolve(nombre + ".png"),
            ((TakesScreenshot) driver)
                .getScreenshotAs(OutputType.BYTES)
        );
    }

    private void verificar(String fase) throws Exception {

        Process proceso = new ProcessBuilder(
            "python3",
            "scripts/fixtures_qa20.py",
            "verificar-moderacion",
            fase
        )
        .redirectErrorStream(true)
        .start();

        if (!proceso.waitFor(60, TimeUnit.SECONDS)) {

            proceso.destroyForcibly();

            fail("Timeout verificando moderacion");
        }

        assertEquals(
            0,
            proceso.exitValue(),
            "Fallo de persistencia: " + fase
        );

        System.out.println(
            "PASS: Moderacion persistida: " + fase
        );
    }

    @Test
    @Tag("demo")
    void aprobarVacanteSinPublicacionAutomatica()
        throws Exception {

        String titulo = variable(
            "SELENIUM_VACANCY_TITLE"
        );

        AdminModerationPage moderacion =
            abrirModeracion();

        moderacion.esperarEstado(
            titulo,
            "Pendiente de revisión"
        );

        captura("admin-vacancy-pending");

        moderacion.aprobar(titulo);

        captura("admin-vacancy-approved-toast");

        moderacion.filtrarAprobadas();

        moderacion.esperarEstado(
            titulo,
            "Aprobada"
        );

        captura("admin-vacancy-approved");

        verificar("aprobada");

        driver.navigate().refresh();

        moderacion.esperarEstado(
            titulo,
            "Aprobada"
        );

        captura("admin-vacancy-approved-persisted");
    }

    @Test
    void rechazarVacanteConMotivoObligatorio()
        throws Exception {

        String titulo = variable(
            "SELENIUM_REJECT_VACANCY_TITLE"
        );

        AdminModerationPage moderacion =
            abrirModeracion();

        moderacion.abrirRechazo(titulo);

        captura("admin-reject-modal");

        moderacion.confirmarSinMotivo();

        captura("admin-reject-required-reason");

        verificar("sin_motivo");

        moderacion.rechazar(
            titulo,
            "Vacante sintetica QA20: requisitos por corregir."
        );

        moderacion.filtrarNoAprobadas();

        moderacion.esperarEstado(
            titulo,
            "No aprobada / Despublicada"
        );

        captura("admin-vacancy-rejected");

        verificar("no_aprobada");

        driver.navigate().refresh();

        moderacion.esperarEstado(
            titulo,
            "No aprobada / Despublicada"
        );

        captura("admin-vacancy-rejected-persisted");
    }
}
