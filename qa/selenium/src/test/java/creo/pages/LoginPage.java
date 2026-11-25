package creo.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;

public class LoginPage extends BasePage {

    private final By correo =
        By.cssSelector("form input[type='email']");

    private final By password =
        By.cssSelector("form input[type='password']");

    private final By ingresar =
        By.cssSelector("form button[type='submit']");

    private final By alerta =
        By.cssSelector("app-creo-alert");

    public LoginPage(
        WebDriver driver,
        WebDriverWait wait
    ) {
        super(driver, wait);
    }

    public void abrir(String baseUrl) {

        driver.get(baseUrl + "/creo/landing");

        visible(correo);
        visible(password);
    }

    public void iniciarSesion(
        String email,
        String clave
    ) {

        escribir(correo, email);
        escribir(password, clave);
        click(ingresar);
    }

    public void esperarDashboardCandidato() {
        esperarUrl("/creo/candidate-dashboard");
    }

    public void esperarInicioEmpresa() {
        esperarUrl("/creo/company-home");
    }

    public void esperarDashboardAdmin() {
        esperarUrl("/creo/admin-dashboard");
    }

    public String mensajeError() {
        return texto(alerta);
    }
}
