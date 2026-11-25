package creo.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.StaleElementReferenceException;

import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class CandidateJobsPage extends BasePage {

    private final By buscador =
        By.cssSelector("input[type='search'][maxlength='100']");

    private final By tarjetas =
        By.cssSelector("app-job-card");

    private final WebDriverWait esperaDinamica;

    public CandidateJobsPage(
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

        driver.get(baseUrl + "/creo/candidate-jobs");

        visible(buscador);
    }

    public void buscar(String titulo) {

        escribir(buscador, titulo);
    }

    public boolean contieneVacante(String titulo) {

        return esperaDinamica.until(d -> {

            for (WebElement tarjeta : d.findElements(tarjetas)) {

                if (tarjeta.isDisplayed()
                    && tarjeta.getText().contains(titulo)) {

                    return true;
                }
            }

            return false;
        });
    }

    public void abrirVacante(String titulo) {

        esperaDinamica.until(d -> {

            for (WebElement tarjeta : d.findElements(tarjetas)) {

                if (tarjeta.isDisplayed()
                    && tarjeta.getText().contains(titulo)) {

                    WebElement boton = tarjeta.findElement(
                        By.xpath(
                            ".//button[normalize-space()='Ver oferta'"
                            + " or normalize-space()='Ver detalle']"
                        )
                    );

                    if (boton.isDisplayed() && boton.isEnabled()) {

                        boton.click();

                        return true;
                    }
                }
            }

            return false;
        });

        esperarUrl("/creo/candidate-job-detail");
    }

    public void esperarSinResultados() {

        esperaDinamica.until(
            ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//h3[normalize-space()='Sin resultados']")
            )
        );
    }
}
