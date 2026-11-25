package creo.tests;

import creo.support.BaseTest;
import creo.pages.LoginPage;
import creo.pages.CompanyKanbanPage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@Tag("company-admin")
class CompanyConflictTest extends BaseTest {

    private String variable(String nombre) {

        String valor = System.getenv(nombre);

        assertNotNull(valor, nombre);
        assertFalse(valor.isBlank());

        return valor;
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
            "verificar-conflicto",
            fase
        )
        .redirectErrorStream(true)
        .redirectOutput(
            ProcessBuilder.Redirect.DISCARD
        )
        .start();

        if (!proceso.waitFor(90, TimeUnit.SECONDS)) {

            proceso.destroyForcibly();

            fail("Timeout verificando cupos");
        }

        assertEquals(
            0,
            proceso.exitValue(),
            "Fallo verificando conflicto: " + fase
        );

        System.out.println(
            "PASS: Conflicto de contratacion - " + fase
        );
    }

    @Test
    void impedirContratacionPorCupoAgotado()
        throws Exception {

        String alfa = variable(
            "SELENIUM_APPLICATION_A_NAME"
        );

        String beta = variable(
            "SELENIUM_APPLICATION_B_NAME"
        );

        String vacante = variable(
            "SELENIUM_CONFLICT_VACANCY_ID"
        );

        LoginPage login = new LoginPage(driver, wait);

        login.abrir(baseUrl);

        login.iniciarSesion(
            variable("SELENIUM_COMPANY_EMAIL"),
            variable("SELENIUM_FIXTURE_PASSWORD")
        );

        login.esperarInicioEmpresa();

        CompanyKanbanPage kanban =
            new CompanyKanbanPage(driver, wait);

        kanban.abrir(baseUrl, vacante);

        verificar("inicial");

        captura("conflict-initial");

        // Primera contratacion permitida.

        kanban.abrirCandidato(alfa);

        kanban.esperarPerfil(alfa);

        kanban.avanzar("Marcar como Contratado");

        kanban.esperarMovimiento(
            "Contratación registrada correctamente."
        );

        kanban.esperarEstadoFinal(alfa);

        verificar("contratacion");

        captura("conflict-first-hired");

        // Segunda contratacion no permitida.

        kanban.abrir(baseUrl, vacante);

        kanban.abrirCandidato(beta);

        kanban.esperarPerfil(beta);

        kanban.avanzar("Marcar como Contratado");

        kanban.esperarLimiteContratacion();

        captura("conflict-capacity-message");

        verificar("bloqueado");

        driver.navigate().refresh();

        kanban.esperarEstadoFinal(alfa);

        kanban.abrirCandidato(beta);

        kanban.esperarPerfil(beta);

        verificar("bloqueado");

        captura("conflict-persisted");

        System.out.println(
            "PASS: Limite de contrataciones respetado"
        );
    }
}
