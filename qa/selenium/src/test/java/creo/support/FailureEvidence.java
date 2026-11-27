package creo.support;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestExecutionExceptionHandler;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;

public class FailureEvidence
    implements TestExecutionExceptionHandler {

    @Override
    public void handleTestExecutionException(
        ExtensionContext context,
        Throwable error
    ) throws Throwable {

        try {
            Object instancia =
                context.getRequiredTestInstance();

            if (instancia instanceof BaseTest test
                && test.driver != null) {

                Path directorio = Path.of(
                    "target",
                    "qa-evidence",
                    "failures"
                );

                Files.createDirectories(directorio);

                String nombre =
                    context.getRequiredTestClass().getSimpleName()
                    + "-"
                    + context.getRequiredTestMethod().getName();

                byte[] captura =
                    ((TakesScreenshot) test.driver)
                        .getScreenshotAs(OutputType.BYTES);

                Files.write(
                    directorio.resolve(nombre + ".png"),
                    captura
                );

                Files.writeString(
                    directorio.resolve(nombre + ".txt"),
                    "Test: " + nombre + "\n"
                    + "Error type: "
                    + error.getClass().getSimpleName()
                    + "\n"
                );

                System.out.println(
                    "EVIDENCIA: " + nombre
                );
            }
        } catch (Exception evidenciaError) {
            error.addSuppressed(evidenciaError);
        }

        throw error;
    }
}
