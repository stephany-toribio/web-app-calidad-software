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

        System.out.println("QA_STEP: 01_LOGIN");
        iniciarSesion();
        System.out.println("QA_STEP_PASS: 01_LOGIN");

        CandidateJobsPage jobs =
            new CandidateJobsPage(driver, wait);

        System.out.println("QA_STEP: 02_ABRIR_BUSQUEDA");
        jobs.abrir(baseUrl);
        System.out.println("QA_STEP_PASS: 02_ABRIR_BUSQUEDA");

        System.out.println("QA_STEP: 03_BUSCAR_VACANTE");
        jobs.buscar(titulo);
        System.out.println("QA_STEP_PASS: 03_BUSCAR_VACANTE");

        assertTrue(
            jobs.contieneVacante(titulo)
        );

        captura("candidate-search-result");

        System.out.println("QA_STEP: 04_ABRIR_DETALLE");
        jobs.abrirVacante(titulo);
        System.out.println("QA_STEP_PASS: 04_ABRIR_DETALLE");

        CandidateJobDetailPage detalle =
            new CandidateJobDetailPage(driver, wait);

        System.out.println("QA_STEP: 05_ESPERAR_TITULO");
        detalle.esperarTitulo(titulo);
        System.out.println("QA_STEP_PASS: 05_ESPERAR_TITULO");

        captura("candidate-job-detail");

        System.out.println("QA_STEP: 06_CONFIRMACION");
        detalle.abrirConfirmacion();
        System.out.println("QA_STEP_PASS: 06_CONFIRMACION");

        System.out.println("QA_STEP: 07_CANCELAR");
        detalle.cancelarPostulacion();
        System.out.println("QA_STEP_PASS: 07_CANCELAR");

        captura("candidate-apply-cancel");

        System.out.println("QA_STEP: 08_MYSQL_CANCELADA");
        verificarMySQL("cancelada");
        System.out.println("QA_STEP_PASS: 08_MYSQL_CANCELADA");

        System.out.println("QA_STEP: 06_CONFIRMACION");
        detalle.abrirConfirmacion();
        System.out.println("QA_STEP_PASS: 06_CONFIRMACION");

        captura("candidate-apply-confirmation");

        System.out.println("QA_STEP: 09_POSTULAR");
        detalle.confirmarPostulacion();
        System.out.println("QA_STEP_PASS: 09_POSTULAR");

        assertFalse(
            detalle.permiteDuplicado(),
            "La interfaz debe impedir una segunda postulacion"
        );

        captura("candidate-applied");

        System.out.println("QA_STEP: 10_MYSQL_CREADA");
        verificarMySQL("creada");
        System.out.println("QA_STEP_PASS: 10_MYSQL_CREADA");

        System.out.println("QA_STEP: 11_RECARGAR");
        driver.navigate().refresh();
        System.out.println("QA_STEP_PASS: 11_RECARGAR");

        System.out.println("QA_STEP: 05_ESPERAR_TITULO");
        detalle.esperarTitulo(titulo);
        System.out.println("QA_STEP_PASS: 05_ESPERAR_TITULO");

        System.out.println("QA_STEP: 12_ESPERAR_POSTULADO");
        detalle.esperarPostulado();
        System.out.println("QA_STEP_PASS: 12_ESPERAR_POSTULADO");

        assertFalse(detalle.permiteDuplicado());

        captura("candidate-applied-persisted");

        System.out.println("QA_STEP: 13_MYSQL_PERSISTIDA");
        verificarMySQL("persistida");
        System.out.println("QA_STEP_PASS: 13_MYSQL_PERSISTIDA");

        CandidateApplicationsPage aplicaciones =
            new CandidateApplicationsPage(driver, wait);

        System.out.println("QA_STEP: 14_ABRIR_POSTULACIONES");
        aplicaciones.abrir(baseUrl);
        System.out.println("QA_STEP_PASS: 14_ABRIR_POSTULACIONES");

        System.out.println("QA_STEP: 15_ESPERAR_VACANTE");
        aplicaciones.esperarVacante(titulo);
        System.out.println("QA_STEP_PASS: 15_ESPERAR_VACANTE");

        captura("candidate-application-listed");

        System.out.println("QA_STEP: 16_DESPLEGAR");
        aplicaciones.desplegarPostulacion(titulo);
        System.out.println("QA_STEP_PASS: 16_DESPLEGAR");

        System.out.println("QA_STEP: 17_ABRIR_RETIRO");
        aplicaciones.abrirRetiroUnico();
        System.out.println("QA_STEP_PASS: 17_ABRIR_RETIRO");

        captura("candidate-withdraw-confirmation");

        System.out.println("QA_STEP: 18_CONFIRMAR_RETIRO");
        aplicaciones.confirmarRetiro();
        System.out.println("QA_STEP_PASS: 18_CONFIRMAR_RETIRO");

        captura("candidate-withdraw-success");

        System.out.println("QA_STEP: 11_RECARGAR");
        driver.navigate().refresh();
        System.out.println("QA_STEP_PASS: 11_RECARGAR");

        System.out.println("QA_STEP: 15_ESPERAR_VACANTE");
        aplicaciones.esperarVacante(titulo);
        System.out.println("QA_STEP_PASS: 15_ESPERAR_VACANTE");

        System.out.println("QA_STEP: 16_DESPLEGAR");
        aplicaciones.desplegarPostulacion(titulo);
        System.out.println("QA_STEP_PASS: 16_DESPLEGAR");

        System.out.println("QA_STEP: 19_ESPERAR_RETIRO");
        aplicaciones.esperarRetirada();
        System.out.println("QA_STEP_PASS: 19_ESPERAR_RETIRO");

        captura("candidate-withdraw-persisted");

        System.out.println("QA_STEP: 20_MYSQL_RETIRADA");
        verificarMySQL("retirada");
        System.out.println("QA_STEP_PASS: 20_MYSQL_RETIRADA");
    }
}
