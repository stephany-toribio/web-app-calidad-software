package creo.tests;

import creo.support.BaseTest;
import creo.pages.LoginPage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

@Tag("company-admin")
class CompanyAdminAuthTest extends BaseTest {

    private String variable(String nombre) {

        String valor = System.getenv(nombre);

        assertNotNull(valor, nombre);
        assertFalse(valor.isBlank());

        return valor;
    }

    private LoginPage iniciarSesion(String variableCorreo) {

        LoginPage login = new LoginPage(driver, wait);

        login.abrir(baseUrl);

        login.iniciarSesion(
            variable(variableCorreo),
            variable("SELENIUM_FIXTURE_PASSWORD")
        );

        return login;
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

    @Test
    @Tag("demo")
    void loginEmpresaValido() throws Exception {

        LoginPage login = iniciarSesion(
            "SELENIUM_COMPANY_EMAIL"
        );

        login.esperarInicioEmpresa();

        assertTrue(
            driver.getCurrentUrl()
                .contains("/creo/company-home")
        );

        captura("company-login-success");
    }

    @Test
    @Tag("demo")
    void loginAdminValido() throws Exception {

        LoginPage login = iniciarSesion(
            "SELENIUM_ADMIN_EMAIL"
        );

        login.esperarDashboardAdmin();

        assertTrue(
            driver.getCurrentUrl()
                .contains("/creo/admin-dashboard")
        );

        captura("admin-login-success");
    }

    @Test
    void empresaNoAccedeAdministracion() throws Exception {

        LoginPage login = iniciarSesion(
            "SELENIUM_COMPANY_EMAIL"
        );

        login.esperarInicioEmpresa();

        driver.get(
            baseUrl + "/creo/admin-dashboard"
        );

        wait.until(d ->
            !d.getCurrentUrl()
                .contains("/creo/admin-dashboard")
        );

        assertFalse(
            driver.getCurrentUrl()
                .contains("/creo/admin-dashboard")
        );

        captura("company-forbidden-admin");
    }

    @Test
    void adminNoAccedePerfilCandidato() throws Exception {

        LoginPage login = iniciarSesion(
            "SELENIUM_ADMIN_EMAIL"
        );

        login.esperarDashboardAdmin();

        driver.get(
            baseUrl + "/creo/candidate-profile"
        );

        wait.until(d ->
            !d.getCurrentUrl()
                .contains("/creo/candidate-profile")
        );

        assertFalse(
            driver.getCurrentUrl()
                .contains("/creo/candidate-profile")
        );

        captura("admin-forbidden-candidate");
    }
}
