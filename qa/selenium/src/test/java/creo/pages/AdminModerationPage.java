package creo.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.StaleElementReferenceException;

import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class AdminModerationPage extends BasePage {

    private final WebDriverWait dinamica;

    private final By motivo =
        By.cssSelector("textarea[placeholder^='Explica a la empresa']");

    private final By confirmar =
        By.xpath("//button[normalize-space()='Confirmar']");

    public AdminModerationPage(
        WebDriver driver,
        WebDriverWait wait
    ) {
        super(driver, wait);

        dinamica = new WebDriverWait(
            driver,
            Duration.ofSeconds(15)
        );

        dinamica.pollingEvery(
            Duration.ofMillis(200)
        );

        dinamica.ignoring(
            StaleElementReferenceException.class
        );
    }

    public void abrir(String baseUrl) {

        driver.get(
            baseUrl + "/creo/admin-moderation"
        );

        visible(By.xpath(
            "//h1[normalize-space()='Revisión de Vacantes']"
        ));
    }

    private By fila(String titulo) {

        if (titulo.contains("'")) {
            throw new IllegalArgumentException(
                "Titulo sintetico invalido"
            );
        }

        return By.xpath(
            "//p[@title='Ver detalle completo de la vacante'"
            + " and normalize-space()='" + titulo + "']"
            + "/ancestor::div[.//button[normalize-space()='Detalle']][1]"
        );
    }

    public void esperarEstado(
        String titulo,
        String estado
    ) {

        dinamica.until(d ->
            d.findElements(fila(titulo))
                .stream()
                .anyMatch(e ->
                    e.isDisplayed()
                    && e.getText().contains(estado)
                )
        );
    }

    private void accion(
        String titulo,
        String etiqueta
    ) {

        dinamica.until(d -> {

            for (WebElement elemento : d.findElements(fila(titulo))) {

                if (!elemento.isDisplayed()) {
                    continue;
                }

                WebElement boton = elemento.findElement(
                    By.xpath(
                        ".//button[normalize-space()='"
                        + etiqueta + "']"
                    )
                );

                if (boton.isDisplayed() && boton.isEnabled()) {

                    boton.click();

                    return true;
                }
            }

            return false;
        });
    }

    public void abrirDetalle(String titulo) {

        accion(titulo, "Detalle");

        visible(By.xpath(
            "//h2[normalize-space()='" + titulo + "']"
        ));
    }

    public void aprobar(String titulo) {

        esperarEstado(titulo, "Pendiente de revisión");

        accion(titulo, "Aprobar");

        esperarMensaje(
            "Vacante \"" + titulo
            + "\" aprobada."
        );
    }

    public void abrirRechazo(String titulo) {

        esperarEstado(titulo, "Pendiente de revisión");

        accion(titulo, "No Aprobar");

        visible(motivo);
    }

    public void confirmarSinMotivo() {

        click(confirmar);

        esperarMensaje(
            "Debes ingresar un motivo para no aprobar la vacante"
        );
    }

    public void rechazar(
        String titulo,
        String razon
    ) {

        escribir(motivo, razon);

        click(confirmar);

        wait.until(
            ExpectedConditions.invisibilityOfElementLocated(
                motivo
            )
        );

        esperarMensaje(
            "Vacante \"" + titulo
            + "\" marcada como no aprobada."
        );
    }

    public void filtrarAprobadas() {

        click(By.xpath(
            "//button[normalize-space()='Aprobadas']"
        ));
    }

    public void filtrarNoAprobadas() {

        click(By.xpath(
            "//button[normalize-space()='No Aprobadas']"
        ));
    }

    public void esperarMensaje(String mensaje) {

        dinamica.until(d ->
            d.findElement(By.tagName("body"))
                .getText().contains(mensaje)
        );
    }
}
