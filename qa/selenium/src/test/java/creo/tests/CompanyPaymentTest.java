package creo.tests;

import creo.support.BaseTest;
import creo.pages.LoginPage;
import creo.pages.CompanyJobsPage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@Tag("company-admin")
class CompanyPaymentTest extends BaseTest {

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
            "verificar-pago",
            fase
        )
        .redirectErrorStream(true)
        .start();

        if (!proceso.waitFor(60, TimeUnit.SECONDS)) {

            proceso.destroyForcibly();

            fail("Timeout verificando pago");
        }

        assertEquals(
            0,
            proceso.exitValue(),
            "Fallo de persistencia del pago: " + fase
        );

        System.out.println(
            "PASS: Pago verificado: " + fase
        );
    }

    @Test
    @Tag("demo")
    void pagoSimuladoPublicaVacante()
        throws Exception {

        String titulo = variable(
            "SELENIUM_PAYMENT_VACANCY_TITLE"
        );

        LoginPage login = new LoginPage(driver, wait);

        login.abrir(baseUrl);

        login.iniciarSesion(
            variable("SELENIUM_COMPANY_EMAIL"),
            variable("SELENIUM_FIXTURE_PASSWORD")
        );

        login.esperarInicioEmpresa();

        CompanyJobsPage empleos =
            new CompanyJobsPage(driver, wait);

        empleos.abrir(baseUrl);

        empleos.esperarVacante(titulo);

        verificar("pendiente");

        captura("company-payment-pending");

        empleos.abrirPago(titulo);

        captura("company-payment-modal");

        empleos.postergarPago();

        verificar("postergado");

        captura("company-payment-postponed");

        empleos.abrirPago(titulo);

        empleos.completarPagoSimulado();

        empleos.confirmarPago(titulo);

        empleos.esperarPublicada(titulo);

        captura("company-payment-published");

        verificar("publicada");

        driver.navigate().refresh();

        empleos.esperarPublicada(titulo);

        verificar("persistida");

        captura("company-payment-persisted");
    }
}
