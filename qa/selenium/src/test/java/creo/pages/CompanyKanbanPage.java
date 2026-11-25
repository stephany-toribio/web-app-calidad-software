package creo.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.StaleElementReferenceException;

import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class CompanyKanbanPage extends BasePage {

    private final WebDriverWait dinamica;

    private final By avanzar =
        testId("kanban-advance");

    private final By motivo =
        testId("kanban-reject-reason");

    private final By confirmarRechazo =
        testId("kanban-confirm-reject");

    private final By historial =
        testId("kanban-history");

    private final By panelHistorial =
        testId("kanban-history-panel");

    private final By cerrarHistorial =
        testId("kanban-close-history");

    public CompanyKanbanPage(
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

    public void abrir(
        String baseUrl,
        String vacanteId
    ) {

        driver.get(
            baseUrl
            + "/creo/company-kanban?id="
            + vacanteId
        );

        esperarUrl("/creo/company-kanban");

        visible(historial);
    }

    private By candidato(String nombre) {

        if (nombre.contains("'")) {

            throw new IllegalArgumentException(
                "Nombre sintetico invalido"
            );
        }

        return By.xpath(
            "//div[@draggable]//p"
            + "[normalize-space()='" + nombre + "']"
        );
    }

    public void abrirCandidato(String nombre) {

        dinamica.until(d -> {

            for (
                WebElement elemento :
                d.findElements(candidato(nombre))
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

    private String contenido(WebElement elemento) {

        String texto = elemento.getDomProperty("textContent");

        return texto == null
            ? ""
            : texto.replaceAll("\\s+", " ").trim();
    }

    private void diagnosticarBoton(String etiqueta) {

        try {

            for (
                org.openqa.selenium.logging.LogEntry entrada :
                driver.manage().logs().get(
                    org.openqa.selenium.logging.LogType.BROWSER
                )
            ) {

                if (
                    entrada.getLevel().intValue()
                    >= java.util.logging.Level.WARNING.intValue()
                ) {

                    System.out.println(
                        "ANGULAR-DIAG: "
                        + entrada.getLevel()
                        + " "
                        + entrada.getMessage()
                    );
                }
            }

        } catch (Exception error) {

            System.out.println(
                "ANGULAR-DIAG: No se pudo recuperar consola: "
                + error.getClass().getSimpleName()
            );
        }



        System.out.println(
            "KANBAN-DIAG esperado=[" + etiqueta + "]"
        );

        for (WebElement boton : driver.findElements(avanzar)) {

            System.out.println(
                "KANBAN-DIAG getText=["
                + boton.getText() + "]"
            );

            System.out.println(
                "KANBAN-DIAG textContent=["
                + boton.getDomProperty("textContent") + "]"
            );

            System.out.println(
                "KANBAN-DIAG innerText=["
                + boton.getDomProperty("innerText") + "]"
            );

            System.out.println(
                "KANBAN-DIAG normalizado=["
                + contenido(boton) + "]"
            );

            System.out.println(
                "KANBAN-DIAG outerHTML="
                + boton.getDomProperty("outerHTML")
            );

            System.out.println(
                "KANBAN-DIAG visible="
                + boton.isDisplayed()
                + ", habilitado="
                + boton.isEnabled()
            );

            System.out.println(
                "KANBAN-DIAG unicode="
                + java.util.Arrays.toString(
                    contenido(boton).codePoints().toArray()
                )
            );
        }
    }

    public void esperarAccion(String etiqueta) {

        try {

            dinamica.withMessage(
                "Accion Kanban esperada: " + etiqueta
            ).until(d -> {

                for (WebElement boton : d.findElements(avanzar)) {

                    if (
                        boton.isDisplayed()
                        && boton.isEnabled()
                        && contenido(boton).equals(etiqueta)
                    ) {
                        return true;
                    }
                }

                return false;
            });

        } catch (org.openqa.selenium.TimeoutException error) {

            diagnosticarBoton(etiqueta);

            throw error;
        }
    }

    public void avanzar(String etiqueta) {

        esperarAccion(etiqueta);

        WebElement boton = dinamica.until(
            ExpectedConditions.elementToBeClickable(avanzar)
        );

        ((org.openqa.selenium.JavascriptExecutor) driver)
            .executeScript(
                "arguments[0].scrollIntoView({block:'center'});",
                boton
            );

        esperarAccion(etiqueta);

        org.junit.jupiter.api.Assertions.assertEquals(
            etiqueta,
            contenido(visible(avanzar))
        );

        org.junit.jupiter.api.Assertions.assertEquals(
            etiqueta,
            visible(avanzar).getAccessibleName(),
            "Nombre accesible incorrecto en accion Kanban"
        );

        click(avanzar);
    }

    private final By perfil =
        By.xpath("//p[normalize-space()='Perfil del postulante']");

    public void esperarPerfil(String nombre) {

        visible(perfil);

        visible(By.xpath(
            "//h2[normalize-space()='" + nombre + "']"
        ));
    }

    public void comprobarFormacionIncompleta() {

        By carrera = By.xpath(
            "//p[normalize-space()='Carrera no registrada']"
        );

        By institucion = By.xpath(
            "//p[contains(normalize-space(),'Institución no registrada')]"
        );

        visible(carrera);

        visible(institucion);

        esperarAccion("Mover a Revisión");

        org.junit.jupiter.api.Assertions.assertEquals(
            "Mover a Revisión",
            visible(avanzar).getAccessibleName()
        );

        System.out.println(
            "PASS: Perfil incompleto renderizado sin bloquear Kanban"
        );
    }

    public void esperarMovimiento(String mensaje) {

        wait.until(
            ExpectedConditions.invisibilityOfElementLocated(
                perfil
            )
        );

        dinamica.until(d ->
            d.findElement(By.tagName("body"))
                .getText().contains(mensaje)
        );
    }

    public void esperarEstadoFinal(String nombre) {

        By tarjeta = By.xpath(
            "//div[@draggable='false']"
            + "[.//p[normalize-space()='" + nombre + "']]"
            + "[.//span[normalize-space()='Estado final inmutable (bloqueado)']]"
        );

        visible(tarjeta);
    }

    public void comprobarAccionesFinalesBloqueadas(
        String nombre
    ) {

        abrirCandidato(nombre);

        esperarPerfil(nombre);

        esperarSinAvance();

        org.junit.jupiter.api.Assertions.assertFalse(
            driver.findElements(By.xpath(
                "//button[normalize-space()='Rechazar candidato']"
            ))
            .stream()
            .anyMatch(WebElement::isDisplayed)
        );
    }

    public void esperarLimiteContratacion() {

        visible(By.xpath(
            "//*[normalize-space()='Límite de contratación alcanzado.']"
        ));
    }

    public void esperarSinAvance() {

        wait.until(
            ExpectedConditions.invisibilityOfElementLocated(
                avanzar
            )
        );
    }

    public void abrirRechazo() {

        dinamica.until(d -> {

            for (
                WebElement boton :
                d.findElements(By.xpath(
                    "//button[normalize-space()='Rechazar candidato']"
                ))
            ) {

                if (boton.isDisplayed() && boton.isEnabled()) {

                    boton.click();

                    return true;
                }
            }

            return false;
        });

        visible(motivo);
    }

    public boolean rechazoSinMotivoBloqueado() {

        return !visible(confirmarRechazo).isEnabled();
    }

    public String seleccionarMotivo() {

        dinamica.until(d ->
            new Select(d.findElement(motivo))
                .getOptions().size() > 1
        );

        Select select = new Select(visible(motivo));

        select.selectByIndex(1);

        return select.getFirstSelectedOption()
            .getText().trim();
    }

    public void confirmarRechazo() {

        click(confirmarRechazo);

        wait.until(
            ExpectedConditions.invisibilityOfElementLocated(
                confirmarRechazo
            )
        );
    }

    public void abrirHistorial() {

        click(historial);

        visible(panelHistorial);
    }

    public void comprobarHistorial(
        String postulacionId,
        String... estados
    ) {

        By registro =
            testId("history-application-" + postulacionId);

        dinamica.until(d -> {

            for (
                WebElement elemento :
                d.findElements(registro)
            ) {

                if (!elemento.isDisplayed()) {
                    continue;
                }

                String texto = contenido(elemento);

                boolean cumple = true;

                for (String estado : estados) {

                    if (!texto.contains(estado)) {
                        cumple = false;
                        break;
                    }
                }

                if (cumple) {
                    return true;
                }
            }

            return false;
        });
    }

    public void cerrarHistorial() {

        click(cerrarHistorial);

        wait.until(
            ExpectedConditions.invisibilityOfElementLocated(
                panelHistorial
            )
        );
    }
}
