package creo.tests;

import creo.support.BaseTest;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;

import org.openqa.selenium.By;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

import org.openqa.selenium.support.ui.ExpectedConditions;

import static org.junit.jupiter.api.Assertions.*;

class SmokeTest extends BaseTest {

    @Test
    void navegadorCargaFrontendReal() throws Exception {

        driver.get(baseUrl + "/");

        wait.until(
            ExpectedConditions
                .visibilityOfElementLocated(
                    By.cssSelector("body")
                )
        );

        wait.until(d -> !d.findElement(
            By.cssSelector("body")
        ).getText().isBlank());

        String url = driver.getCurrentUrl();
        String titulo = driver.getTitle();

        assertTrue(
            url.startsWith(baseUrl),
            "El navegador debe permanecer en el frontend QA"
        );

        assertFalse(titulo.isBlank());

        Path directorio = Path.of(
            "target",
            "qa-evidence"
        );

        Files.createDirectories(directorio);

        byte[] captura =
            ((TakesScreenshot) driver)
                .getScreenshotAs(OutputType.BYTES);

        Files.write(
            directorio.resolve("smoke-frontend.png"),
            captura
        );

        System.out.println("PASS: Chrome conectado");
        System.out.println("PASS: Frontend cargado");
        System.out.println("URL: " + url);
        System.out.println("Titulo: " + titulo);
    }
}
