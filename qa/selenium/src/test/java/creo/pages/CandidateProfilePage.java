package creo.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class CandidateProfilePage extends BasePage {

    private final By editar =
        By.xpath("//button[normalize-space()='Editar perfil']");

    private final By tituloModal =
        By.xpath("//h2[normalize-space()='Editar presentación']");

    private final By nombres =
        By.xpath("//label[starts-with(normalize-space(),'Nombres')]/following-sibling::input");

    private final By correo =
        By.cssSelector("input[type='email'][disabled]");

    private final By guardar =
        By.xpath("//button[normalize-space()='Guardar']");

    private final By titulo =
        By.cssSelector("app-candidate-profile h1");

    public CandidateProfilePage(
        WebDriver driver,
        WebDriverWait wait
    ) {
        super(driver, wait);
    }

    public void esperarPerfil(String email) {

        visible(editar);

        visible(
            By.xpath("//app-candidate-profile//p[normalize-space()='"
                + email + "']")
        );
    }

    public void abrirEdicion() {

        click(editar);

        visible(tituloModal);
    }

    public boolean correoProtegido() {

        return !visible(correo).isEnabled();
    }

    public void cambiarNombre(String nombre) {

        escribir(nombres, nombre);
    }

    public void guardarCambios() {

        click(guardar);

        wait.until(
            ExpectedConditions.invisibilityOfElementLocated(
                tituloModal
            )
        );
    }

    public void esperarNombre(String nombre) {

        wait.until(d ->
            d.findElements(titulo)
                .stream()
                .anyMatch(e -> e.isDisplayed()
                    && e.getText().startsWith(nombre + " "))
        );
    }
}
