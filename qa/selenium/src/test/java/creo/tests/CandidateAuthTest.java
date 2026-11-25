package creo.tests;

import creo.support.BaseTest;
import creo.pages.LoginPage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

import org.openqa.selenium.By;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

@Tag("candidate")
class CandidateAuthTest extends BaseTest {

    private String variable(String nombre) {

        String valor = System.getenv(nombre);

        assertNotNull(valor, "Variable QA requerida: " + nombre);
        assertFalse(valor.isBlank());

        return valor;
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
    @Tag("demo")
    void loginValidoCandidato() throws Exception {

        LoginPage login = new LoginPage(driver, wait);

        login.abrir(baseUrl);

        login.iniciarSesion(
            variable("SELENIUM_CANDIDATE_EMAIL"),
            variable("SELENIUM_FIXTURE_PASSWORD")
        );

        login.esperarPerfilCandidato();

        assertTrue(
            driver.getCurrentUrl()
                .contains("/creo/candidate-profile")
        );

        captura("candidate-login-success");
    }

    @Test
    void loginConPasswordIncorrecto() throws Exception {

        LoginPage login = new LoginPage(driver, wait);

        login.abrir(baseUrl);

        login.iniciarSesion(
            variable("SELENIUM_NEGATIVE_EMAIL"),
            "PasswordIncorrecto-QA-2026!"
        );

        assertTrue(
            login.mensajeError().contains(
                "Correo o contraseña incorrectos"
            )
        );

        assertTrue(
            driver.getCurrentUrl().contains("/creo/landing")
        );

        captura("candidate-login-invalid");
    }

    @Test
    void accesoSinSesionRedirigeAlLogin() throws Exception {

        driver.get(baseUrl + "/creo/candidate-profile");

        wait.until(
            ExpectedConditions.urlContains("/creo/landing")
        );

        wait.until(
            ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("form input[type='email']")
            )
        );

        captura("candidate-unauthenticated");
    }

    @Test
    void candidatoNoAccedeARutaEmpresarial() throws Exception {

        LoginPage login = new LoginPage(driver, wait);

        login.abrir(baseUrl);

        login.iniciarSesion(
            variable("SELENIUM_CANDIDATE_EMAIL"),
            variable("SELENIUM_FIXTURE_PASSWORD")
        );

        login.esperarPerfilCandidato();

        driver.get(baseUrl + "/creo/company-home");

        wait.until(
            d -> !d.getCurrentUrl().contains("/creo/company-home")
        );

        wait.until(
            ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("app-creo-landing, app-candidate-profile, app-candidate-dashboard")
            )
        );

        assertFalse(
            driver.getCurrentUrl().contains("/creo/company-home")
        );

        captura("candidate-forbidden-company");
    }
}
