package creo.tests;

import creo.support.BaseTest;
import creo.pages.LoginPage;
import creo.pages.CandidateJobsPage;
import creo.pages.CandidateJobDetailPage;
import creo.pages.CandidateApplicationsPage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

@Tag("candidate")
class CandidateBusinessTest extends BaseTest {

    private String variable(String nombre) {

        String valor = System.getenv(nombre);

        assertNotNull(valor, "Variable QA requerida: " + nombre);
        assertFalse(valor.isBlank());

        return valor;
    }

    private void iniciarSesion() {

        LoginPage login = new LoginPage(driver, wait);

        login.abrir(baseUrl);

        login.iniciarSesion(
            variable("SELENIUM_BUSINESS_EMAIL"),
            variable("SELENIUM_FIXTURE_PASSWORD")
        );

        login.esperarPerfilCandidato();
    }

    private void verificarMySQL(String fase) throws Exception {

        Process proceso = new ProcessBuilder(
            "python3",
            "scripts/fixtures.py",
            "verificar",
            fase
        )
        .redirectErrorStream(true)
        .start();

        boolean terminado = proceso.waitFor(
            60,
            java.util.concurrent.TimeUnit.SECONDS
        );

        if (!terminado) {
            proceso.destroyForcibly();
            fail("Timeout de verificacion MySQL: " + fase);
        }

        assertEquals(
            0,
            proceso.exitValue(),
            "Verificacion MySQL fallida: " + fase
        );

        System.out.println("PASS: MySQL postulacion " + fase);
    }

    private void captura(String nombre) throws Exception {

        Path directorio = Path.of("target", "qa-evidence");

        Files.createDirectories(directorio);

        Files.write(
            directorio.resolve(nombre + ".png"),
            ((TakesScreenshot) driver)
                .getScreenshotAs(OutputType.BYTES)
        );
    }

    @Test
    void busquedaSinResultados() throws Exception {

        iniciarSesion();

        CandidateJobsPage jobs =
            new CandidateJobsPage(driver, wait);

        jobs.abrir(baseUrl);

        jobs.buscar(
            "SIN-RESULTADOS-" + variable("SELENIUM_RUN_ID")
        );

        jobs.esperarSinResultados();

        captura("candidate-search-empty");
    }

    @Test
    @Tag("demo")
    void recorridoCompletoCandidato() throws Exception {

        String titulo = variable("SELENIUM_VACANCY_TITLE");

        iniciarSesion();

        CandidateJobsPage jobs =
            new CandidateJobsPage(driver, wait);

        jobs.abrir(baseUrl);

        jobs.buscar(titulo);

        assertTrue(
            jobs.contieneVacante(titulo)
        );

        captura("candidate-search-result");

        jobs.abrirVacante(titulo);

        CandidateJobDetailPage detalle =
            new CandidateJobDetailPage(driver, wait);

        detalle.esperarTitulo(titulo);

        captura("candidate-job-detail");

        detalle.abrirConfirmacion();

        detalle.cancelarPostulacion();

        captura("candidate-apply-cancel");

        verificarMySQL("cancelada");

        detalle.abrirConfirmacion();

        captura("candidate-apply-confirmation");

        detalle.confirmarPostulacion();

        assertFalse(
            detalle.permiteDuplicado(),
            "La interfaz debe impedir una segunda postulacion"
        );

        captura("candidate-applied");

        verificarMySQL("creada");

        driver.navigate().refresh();

        detalle.esperarTitulo(titulo);

        detalle.esperarPostulado();

        assertFalse(detalle.permiteDuplicado());

        captura("candidate-applied-persisted");

        verificarMySQL("persistida");

        CandidateApplicationsPage aplicaciones =
            new CandidateApplicationsPage(driver, wait);

        aplicaciones.abrir(baseUrl);

        aplicaciones.esperarVacante(titulo);

        captura("candidate-application-listed");

        aplicaciones.desplegarPostulacion(titulo);

        aplicaciones.abrirRetiroUnico();

        captura("candidate-withdraw-confirmation");

        aplicaciones.confirmarRetiro();

        captura("candidate-withdraw-success");

        driver.navigate().refresh();

        aplicaciones.esperarVacante(titulo);

        aplicaciones.desplegarPostulacion(titulo);

        aplicaciones.esperarRetirada();

        captura("candidate-withdraw-persisted");

        verificarMySQL("retirada");
    }
}
