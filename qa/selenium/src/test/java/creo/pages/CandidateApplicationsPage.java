package creo.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.StaleElementReferenceException;

import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class CandidateApplicationsPage extends BasePage {

    private final By retirar =
        By.xpath("//button[normalize-space()='Retirar postulación']");

    private final By confirmar =
        testId("confirm-withdraw");

    private final By mensajeRetirada =
        By.xpath("//*[contains(text(),'Te retiraste voluntariamente de este proceso de selección')]");

    private final WebDriverWait esperaDinamica;

    public CandidateApplicationsPage(
        WebDriver driver,
        WebDriverWait wait
    ) {
        super(driver, wait);

        esperaDinamica = new WebDriverWait(
            driver,
            Duration.ofSeconds(15)
        );

        esperaDinamica.pollingEvery(
            Duration.ofMillis(200)
        );

        esperaDinamica.ignoring(
            StaleElementReferenceException.class
        );
    }

    public void abrir(String baseUrl) {

        driver.get(baseUrl + "/creo/candidate-applications");

        esperarUrl("/creo/candidate-applications");

        visible(
            By.xpath("//h1[normalize-space()='Mis postulaciones']")
        );
    }

    private By tituloPostulacion(String titulo) {

        if (titulo.contains("'")) {

            throw new IllegalArgumentException(
                "Titulo de fixture invalido"
            );
        }

        return By.xpath(
            "//app-candidate-applications"
            + "//p[normalize-space()='" + titulo + "']"
        );
    }

    public void esperarVacante(String titulo) {

        esperaDinamica.until(d ->
            d.findElements(tituloPostulacion(titulo))
                .stream()
                .anyMatch(WebElement::isDisplayed)
        );
    }

    public void desplegarPostulacion(String titulo) {

        esperarVacante(titulo);

        esperaDinamica.until(d -> {

            for (
                WebElement elemento :
                d.findElements(tituloPostulacion(titulo))
            ) {

                if (
                    elemento.isDisplayed()
                    && elemento.isEnabled()
                ) {

                    elemento.click();

                    return true;
                }
            }

            return false;
        });
    }

    public void abrirRetiroUnico() {

        esperaDinamica.until(d ->
            d.findElements(retirar)
                .stream()
                .filter(WebElement::isDisplayed)
                .count() == 1
        );

        click(retirar);

        visible(confirmar);
    }

    public void confirmarRetiro() {

        click(confirmar);

        wait.until(
            ExpectedConditions.invisibilityOfElementLocated(confirmar)
        );

        esperarRetirada();
    }

    public void esperarRetirada() {

        visible(mensajeRetirada);

        wait.until(
            ExpectedConditions.invisibilityOfElementLocated(retirar)
        );
    }
}
