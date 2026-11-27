package creo.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;

public class CandidateRegistrationPage extends BasePage {

    private final By continuar =
        By.xpath("//form//button[normalize-space()='Continuar']");

    private final By nombres =
        By.cssSelector("input[placeholder='Ej. Ana María']");

    private final By dni =
        By.cssSelector("input[placeholder='12345678']");

    private final By correo =
        By.cssSelector("form input[type='email']");

    private final By password =
        By.cssSelector("input[name='pwd']");

    private final By confirmacion =
        By.cssSelector("input[name='pwdConfirm']");

    public CandidateRegistrationPage(
        WebDriver driver,
        WebDriverWait wait
    ) {
        super(driver, wait);
    }

    public void abrir(String baseUrl) {

        driver.get(baseUrl + "/creo/register-candidate");

        visible(nombres);
    }

    public void continuar() {

        click(continuar);
    }

    public void ingresarDatosInvalidos() {

        escribir(nombres, "Candidato QA");

        escribir(dni, "123");

        escribir(correo, "correo-invalido");

        escribir(password, "Abc12345#");

        escribir(confirmacion, "Abc12346#");
    }

    public void completarDatosValidos(
        String email,
        String documento,
        String telefono,
        String clave
    ) {

        escribir(nombres, "Candidato");

        escribir(
            By.cssSelector("input[placeholder='Ej. Torres Quispe']"),
            "Prueba Registro"
        );

        new org.openqa.selenium.support.ui.Select(
            visible(By.name("bday"))
        ).selectByVisibleText("1");

        new org.openqa.selenium.support.ui.Select(
            visible(By.name("bmonth"))
        ).selectByVisibleText("Ene");

        new org.openqa.selenium.support.ui.Select(
            visible(By.name("byear"))
        ).selectByVisibleText("2000");

        escribir(dni, documento);

        escribir(correo, email);

        escribir(
            By.cssSelector("form input[type='tel']"),
            telefono
        );

        escribir(password, clave);

        escribir(confirmacion, clave);
    }

    public void continuarDobleClic() {

        new org.openqa.selenium.interactions.Actions(driver)
            .doubleClick(visible(continuar))
            .perform();
    }

    public void esperarEducacion() {

        visible(By.cssSelector("app-study-list"));

        wait.until(
            org.openqa.selenium.support.ui.ExpectedConditions
                .invisibilityOfElementLocated(nombres)
        );

        org.junit.jupiter.api.Assertions.assertTrue(
            driver.findElements(By.cssSelector("app-study-list"))
                .stream().anyMatch(e -> e.isDisplayed())
        );
    }

    public void esperarError(String mensaje) {

        visible(
            By.xpath("//*[normalize-space()='" + mensaje + "']")
        );
    }

    public boolean permanecePrimerPaso() {

        return visible(nombres).isDisplayed();
    }
}
