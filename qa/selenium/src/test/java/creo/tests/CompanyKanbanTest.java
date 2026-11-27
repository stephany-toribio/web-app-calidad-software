package creo.tests;

import creo.support.BaseTest;
import creo.pages.LoginPage;
import creo.pages.CompanyKanbanPage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

import org.openqa.selenium.By;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.JavascriptExecutor;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@Tag("company-admin")
class CompanyKanbanTest extends BaseTest {

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

    private void verificar(
        String candidato,
        String fase,
        String... argumentos
    ) throws Exception {

        List<String> comando = new ArrayList<>(
            List.of(
                "python3",
                "scripts/fixtures_qa20.py",
                "verificar-kanban",
                candidato,
                fase
            )
        );

        comando.addAll(List.of(argumentos));

        Process proceso = new ProcessBuilder(comando)
            .redirectErrorStream(true)
            .start();

        if (!proceso.waitFor(90, TimeUnit.SECONDS)) {

            proceso.destroyForcibly();

            fail("Timeout verificando Kanban");
        }

        assertEquals(
            0,
            proceso.exitValue(),
            "Fallo de persistencia: "
                + candidato + " - " + fase
        );

        System.out.println(
            "PASS: Kanban "
                + candidato + " - " + fase
        );
    }

    private CompanyKanbanPage abrirKanban() {

        CompanyKanbanPage kanban =
            new CompanyKanbanPage(driver, wait);

        kanban.abrir(
            baseUrl,
            variable("SELENIUM_KANBAN_ID")
        );

        return kanban;
    }

    private void iniciarSesion(String correo) {

        LoginPage login = new LoginPage(driver, wait);

        login.abrir(baseUrl);

        login.iniciarSesion(
            variable(correo),
            variable("SELENIUM_FIXTURE_PASSWORD")
        );
    }

    private void reiniciarSesion() {

        ((JavascriptExecutor) driver).executeScript(
            "window.sessionStorage.clear();"
            + "window.localStorage.clear();"
        );

        driver.manage().deleteAllCookies();

        driver.get(baseUrl + "/creo/landing");
    }

    private void comprobarVistaCandidato(
        String correo,
        String estado,
        String evidencia
    ) throws Exception {

        reiniciarSesion();

        iniciarSesion(correo);

        new LoginPage(driver, wait)
            .esperarPerfilCandidato();

        driver.get(
            baseUrl + "/creo/candidate-applications"
        );

        String titulo = variable(
            "SELENIUM_KANBAN_TITLE"
        );

        By fila = By.xpath(
            "//app-candidate-applications"
            + "//div[contains(@class,'cursor-pointer')]"
            + "[.//p[normalize-space()='" + titulo + "']]"
        );

        wait.until(d -> {

            for (WebElement elemento : d.findElements(fila)) {

                if (!elemento.isDisplayed()) {
                    continue;
                }

                boolean coincide = elemento.findElements(
                    By.xpath(
                        ".//span[normalize-space()='"
                        + estado + "']"
                    )
                ).stream().anyMatch(WebElement::isDisplayed);

                if (coincide) {
                    return true;
                }
            }

            return false;
        });

        captura(evidencia);
    }

    @Test
    @Tag("demo")
    void gestionarContratacionYRechazo()
        throws Exception {

        String alfa = variable(
            "SELENIUM_APPLICATION_A_NAME"
        );

        String beta = variable(
            "SELENIUM_APPLICATION_B_NAME"
        );

        String idAlfa = variable(
            "SELENIUM_APPLICATION_A_ID"
        );

        String idBeta = variable(
            "SELENIUM_APPLICATION_B_ID"
        );

        iniciarSesion("SELENIUM_COMPANY_EMAIL");

        new LoginPage(driver, wait)
            .esperarInicioEmpresa();

        CompanyKanbanPage kanban = abrirKanban();

        verificar("A", "recibido");
        verificar("B", "recibido");

        captura("kanban-initial");

        // CANDIDATO A: REVISION

        kanban.abrirCandidato(alfa);

        kanban.esperarPerfil(alfa);

        kanban.comprobarFormacionIncompleta();

        captura("kanban-incomplete-profile-regression");

        kanban.avanzar("Mover a Revisión");

        kanban.esperarMovimiento(
            "Cambio de etapa registrado correctamente."
        );

        verificar("A", "revision");

        captura("kanban-alfa-review");

        // CANDIDATO A: ENTREVISTA

        kanban.abrirCandidato(alfa);

        kanban.esperarPerfil(alfa);

        kanban.avanzar("Avanzar a Entrevista");

        kanban.esperarMovimiento(
            "Cambio de etapa registrado correctamente."
        );

        verificar("A", "entrevista");

        captura("kanban-alfa-interview");

        // CANDIDATO A: CONTRATACION

        kanban.abrirCandidato(alfa);

        kanban.esperarPerfil(alfa);

        kanban.avanzar("Marcar como Contratado");

        kanban.esperarMovimiento(
            "Contratación registrada correctamente."
        );

        verificar("A", "contratado");

        kanban.esperarEstadoFinal(alfa);

        captura("kanban-alfa-hired");

        kanban.comprobarAccionesFinalesBloqueadas(alfa);

        captura("kanban-alfa-locked");

        // Reabrir tablero sin depender del panel anterior.

        kanban = abrirKanban();

        // CANDIDATO B: REVISION

        kanban.abrirCandidato(beta);

        kanban.esperarPerfil(beta);

        kanban.avanzar("Mover a Revisión");

        kanban.esperarMovimiento(
            "Cambio de etapa registrado correctamente."
        );

        verificar("B", "revision");

        captura("kanban-beta-review");

        // CANDIDATO B: RECHAZO

        kanban.abrirCandidato(beta);

        kanban.esperarPerfil(beta);

        kanban.abrirRechazo();

        assertTrue(
            kanban.rechazoSinMotivoBloqueado(),
            "No debe permitir rechazo sin motivo"
        );

        captura("kanban-beta-reason-required");

        String motivo = kanban.seleccionarMotivo();

        assertFalse(motivo.isBlank());

        captura("kanban-beta-reason-selected");

        kanban.confirmarRechazo();

        kanban.esperarMovimiento(
            "Rechazo registrado correctamente."
        );

        verificar("B", "rechazado", motivo);

        kanban.esperarEstadoFinal(beta);

        captura("kanban-beta-rejected");

        kanban.comprobarAccionesFinalesBloqueadas(beta);

        captura("kanban-beta-locked");

        // HISTORIAL

        kanban = abrirKanban();

        kanban.abrirHistorial();

        kanban.comprobarHistorial(
            idAlfa,
            "En Revisión",
            "Entrevista",
            "Contratado"
        );

        kanban.comprobarHistorial(
            idBeta,
            "En Revisión",
            "Rechazado",
            motivo
        );

        captura("kanban-history");

        kanban.cerrarHistorial();

        // PERSISTENCIA TRAS RECARGA

        driver.navigate().refresh();

        kanban.esperarEstadoFinal(alfa);

        kanban.esperarEstadoFinal(beta);

        captura("kanban-final-persisted");

        verificar("A", "contratado");

        verificar("B", "rechazado", motivo);

        // VISIBILIDAD DESDE AMBOS CANDIDATOS

        comprobarVistaCandidato(
            "SELENIUM_CANDIDATE_A_EMAIL",
            "Contratado",
            "candidate-alfa-hired"
        );

        comprobarVistaCandidato(
            "SELENIUM_CANDIDATE_B_EMAIL",
            "Rechazado",
            "candidate-beta-rejected"
        );
    }
}
