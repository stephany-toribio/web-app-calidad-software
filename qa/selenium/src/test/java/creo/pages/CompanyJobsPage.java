package creo.pages;

import java.time.Duration;
import java.time.Year;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.StaleElementReferenceException;

import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class CompanyJobsPage extends BasePage {

    private final WebDriverWait dinamica;

    private final By modal =
        By.xpath("//h3[normalize-space()='Activar vacante']");

    private final By titular =
        By.cssSelector("input[placeholder='Como figura en la tarjeta']");

    private final By tarjeta =
        By.cssSelector("input[placeholder='1234 5678 9012 3456']");

    private final By vencimiento =
        By.cssSelector("input[placeholder='MM/AA']");

    private final By cvv =
        By.cssSelector("input[placeholder='123'][type='password']");

    private final By confirmar =
        By.xpath("//button[.//span[normalize-space()='Pagar S/ 100.00 y publicar']]");

    private final By pagar =
        By.xpath(".//button[normalize-space()='Pagar y Publicar (S/ 100)']");

    public CompanyJobsPage(
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
            baseUrl + "/creo/company-jobs"
        );

        esperarUrl("/creo/company-jobs");
    }

    private By fila(String titulo) {

        if (titulo.contains("'")) {
            throw new IllegalArgumentException(
                "Titulo sintetico invalido"
            );
        }

        return By.xpath(
            "//div[contains(concat(' ',normalize-space(@class),' '),' jobs-table-row ')]"
            + "[.//p[@title='" + titulo + "']]"
        );
    }

    public void esperarVacante(String titulo) {

        visible(fila(titulo));
    }

    public void abrirPago(String titulo) {

        dinamica.until(d -> {

            for (WebElement row : d.findElements(fila(titulo))) {

                if (!row.isDisplayed()) {
                    continue;
                }

                for (WebElement boton : row.findElements(pagar)) {

                    if (boton.isDisplayed() && boton.isEnabled()) {

                        boton.click();

                        return true;
                    }
                }
            }

            return false;
        });

        visible(modal);

        visible(titular);
    }

    public void postergarPago() {

        click(By.xpath(
            "//button[normalize-space()='Después']"
        ));

        wait.until(
            ExpectedConditions.invisibilityOfElementLocated(modal)
        );

        esperarMensaje("Pago postergado.");
    }

    public void completarPagoSimulado() {

        escribir(titular, "Titular Ficticio QA");

        escribir(tarjeta, "4242424242424242");

        int anio = (Year.now().getValue() + 1) % 100;

        escribir(
            vencimiento,
            String.format("12%02d", anio)
        );

        escribir(cvv, "123");
    }

    public void confirmarPago(String titulo) {

        dinamica.until(
            ExpectedConditions.elementToBeClickable(confirmar)
        ).click();

        wait.until(
            ExpectedConditions.invisibilityOfElementLocated(modal)
        );

        esperarMensaje(
            "La vacante \"" + titulo
            + "\" ya se encuentra publicada!"
        );
    }

    public void esperarPublicada(String titulo) {

        dinamica.until(d -> {

            for (WebElement row : d.findElements(fila(titulo))) {

                if (!row.isDisplayed()) {
                    continue;
                }

                boolean activa = row.findElements(
                    By.xpath(".//span[normalize-space()='Activa']")
                ).stream().anyMatch(WebElement::isDisplayed);

                boolean permitePago = row.findElements(pagar)
                    .stream()
                    .anyMatch(WebElement::isDisplayed);

                if (activa && !permitePago) {
                    return true;
                }
            }

            return false;
        });
    }

    private void esperarMensaje(String mensaje) {

        dinamica.until(d ->
            d.findElement(By.tagName("body"))
                .getText().contains(mensaje)
        );
    }
}
