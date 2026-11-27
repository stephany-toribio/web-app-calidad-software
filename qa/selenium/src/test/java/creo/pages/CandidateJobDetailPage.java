package creo.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class CandidateJobDetailPage extends BasePage {

    private final By titulo =
        By.cssSelector("h1");

    private final By postular =
        By.xpath("//button[normalize-space()='Postular ahora']");

    private final By yaPostulado =
        By.xpath("//button[normalize-space()='Ya postulado']");

    private final By retirado =
        By.xpath("//button[normalize-space()='Te retiraste']");

    private final By confirmar =
        testId("confirm-apply");

    public CandidateJobDetailPage(
        WebDriver driver,
        WebDriverWait wait
    ) {
        super(driver, wait);
    }

    public String tituloVacante() {

        return texto(titulo);
    }

    public void esperarTitulo(String esperado) {

        wait.until(d -> d.findElements(titulo)
            .stream()
            .anyMatch(e -> e.isDisplayed()
                && e.getText().equals(esperado)));
    }

    public void abrirConfirmacion() {

        click(postular);

        visible(confirmar);
    }

    public void confirmarPostulacion() {

        click(confirmar);

        System.out.println("QA_APPLY: CLICK_COMPLETADO");

        wait.until(d -> {

            for (WebElement error :
                d.findElements(testId("apply-error"))) {

                if (error.isDisplayed()
                    && !error.getText().isBlank()) {

                    String mensaje = error.getText();

                    String categoria =
                        mensaje.contains("permisos")
                            ? "PERMISOS"
                        : mensaje.contains("disponible")
                            ? "NO_DISPONIBLE"
                        : mensaje.contains("previamente")
                            ? "DUPLICADA"
                        : mensaje.contains("confirmar el resultado")
                            ? "RED_INCIERTA"
                        : "OTRO_ERROR_API";

                    System.out.println(
                        "QA_APPLY: " + categoria
                    );

                    throw new AssertionError(
                        "Postulacion rechazada: " + categoria
                    );
                }
            }

            return d.findElements(testId("job-apply"))
                .stream()
                .anyMatch(e ->
                    e.isDisplayed()
                    && !e.isEnabled()
                    && "Ya postulado".equals(e.getText())
                );
        });

        System.out.println("QA_APPLY: ESTADO_POSTULADO");

        esperarPostulado();

        System.out.println("QA_APPLY: MODAL_CERRADO");
    }

    public void esperarPostulado() {

        visible(yaPostulado);

        wait.until(
            ExpectedConditions.invisibilityOfElementLocated(confirmar)
        );
    }

    public boolean permiteDuplicado() {

        WebElement boton = visible(yaPostulado);

        return boton.isEnabled();
    }

    public void cancelarPostulacion() {

        click(By.xpath("//button[normalize-space()='Cancelar']"));

        wait.until(
            ExpectedConditions.invisibilityOfElementLocated(confirmar)
        );

        wait.until(
            ExpectedConditions.elementToBeClickable(postular)
        );
    }

    public boolean retiroConfirmado() {

        return !visible(retirado).isEnabled();
    }
}
